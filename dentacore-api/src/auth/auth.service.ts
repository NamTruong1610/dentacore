import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoginPasswordDto } from './dto/login-password.dto.js';
import { Redis } from 'ioredis';
import { REDIS_AUTH } from '../redis/redis.constants.js';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { RedisKeys, RedisTtl } from './stores/auth-redis.keys.js';
import { TokenService } from '../common/crypto/token.service.js';
import { EmployeeService } from '../employee/employee.service.js';
import { PasswordHasher } from '../common/crypto/password-hasher.service.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { MfaService } from './mfa/mfa.service.js';
import { SecretCipherService } from '../common/crypto/secret-cipher.service.js';
import { MfaCredentialsService } from '../mfa-credentials/mfa-credentials.service.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(REDIS_AUTH) private readonly redis: Redis,
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
    private readonly tokenService: TokenService,
    private readonly employeeService: EmployeeService,
    private readonly passwordHasher: PasswordHasher,
    private readonly mfaService: MfaService,
    private readonly secretCipher: SecretCipherService,
    private readonly mfaCredentialsService: MfaCredentialsService
  ) { }
  async login(loginPasswordDto: LoginPasswordDto) {

    const employeeRecord = await this.employeeService.findActiveByEmployeeNo(loginPasswordDto.employeeNumber)

    if (!employeeRecord) {
      throw new UnauthorizedException('Invalid employee number or password')
    }

    const passwordMatched = await this.passwordHasher.compare(loginPasswordDto.password, employeeRecord.passwordHash)

    if (!passwordMatched) {
      throw new UnauthorizedException('Invalid employee number or password')
    }

    // Create pending mfa challenge
    const mfaChallengeIdRaw = this.tokenService.generate()
    const mfaChallengeIdHash = this.tokenService.digest(mfaChallengeIdRaw)
    await this.redis.set(
      RedisKeys.mfaChallenge(mfaChallengeIdHash),
      JSON.stringify({
        employeeId: employeeRecord.id,
        rememberMe: loginPasswordDto.rememberMe
      }),
      'EX',
      RedisTtl.mfaChallenge
    )

    return { mfaChallengeIdRaw }
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const mfaChallengeIdHash = this.tokenService.digest(verifyOtpDto.mfaChallengeIdRaw)

    const rawMfaPayload = await this.redis.get(RedisKeys.mfaChallenge(mfaChallengeIdHash))

    if (!rawMfaPayload) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const parsedPayload = JSON.parse(rawMfaPayload)

    const employeeId: string = parsedPayload.employeeId
    const rememberMe: boolean = parsedPayload.rememberMe 

    const sessionIdRaw = this.tokenService.generate()
    const sessionIdHash = this.tokenService.digest(sessionIdRaw)

    const employeeRecord = await this.employeeService.findActiveByEmployeeId(employeeId)

    if (!employeeRecord) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const encryptedSecret = employeeRecord.mfaCredentials?.encryptedSecret
    if (!encryptedSecret) throw new UnauthorizedException('Invalid credentials')
    const mfaSecretRaw = this.secretCipher.decrypt(encryptedSecret, employeeId)

    const otpVerificationObj = await this.mfaService.verifyTotpToken(mfaSecretRaw, verifyOtpDto.otp, employeeRecord.mfaCredentials.lastUsedTimeStep);
    if (!otpVerificationObj.valid) throw new UnauthorizedException('Invalid credentials');

    const isValidTimeStep = await this.mfaCredentialsService.isOtpValidByTimeStep(employeeRecord.id, otpVerificationObj.timeStep)

    if (!isValidTimeStep) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const claimed = await this.redis.del(RedisKeys.mfaChallenge(mfaChallengeIdHash));
    if (claimed !== 1) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create new session

    let absoluteExpiresAt: number = Date.now() + RedisTtl.sessionAbsolute * 1000
    let sessionIdle: number = RedisTtl.sessionIdle
    let sessionAbsolute: number = RedisTtl.sessionAbsolute

    if (rememberMe) {
      absoluteExpiresAt = Date.now() + RedisTtl.sessionRememberMeAbsolute * 1000
      sessionIdle = RedisTtl.sessionIdleRememberMe
      sessionAbsolute = RedisTtl.sessionRememberMeAbsolute
    }

    await this.redis
      .multi()
      .set(
        RedisKeys.session(sessionIdHash),
        JSON.stringify({
          id: employeeId,
          userAgent: '',
          ip: '',
          absoluteExpiresAt,
          rememberMe
        }),
        'EX',
        sessionIdle
      )
      .sadd(
        RedisKeys.userSessions(employeeRecord.id),
        sessionIdHash,
      )
      .expire(
        RedisKeys.userSessions(employeeRecord.id),
        sessionAbsolute, 'NX'
      ) // new set: give it a TTL
      .expire(
        RedisKeys.userSessions(employeeRecord.id),
        sessionAbsolute, 'GT'
      )
      .exec()

    const sessionIdHashes = await this.redis.smembers(RedisKeys.userSessions(employeeRecord.id))

    const pipeline = this.redis.pipeline()

    if (sessionIdHashes.length > 0) {

      for (const sessionIdHash of sessionIdHashes) {
        pipeline.exists(RedisKeys.session(sessionIdHash))

      }
    }
    const results = await pipeline.exec()

    const expiredSessionHashes: string[] = []

    if (results) {
      for (let i = 0; i < results.length; i++) {
        if (results[i][0] === null && results[i][1] === 0) expiredSessionHashes.push(sessionIdHashes[i])
      }
    }

    if (expiredSessionHashes.length > 0) {
      await this.redis.srem(RedisKeys.userSessions(employeeRecord.id), expiredSessionHashes)
    }

    return { sessionIdRaw, rememberMe }
  }
}

