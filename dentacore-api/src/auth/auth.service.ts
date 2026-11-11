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

@Injectable()
export class AuthService {
  constructor(
    @Inject(REDIS_AUTH) private readonly redis: Redis,
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
    private readonly tokenService: TokenService,
    private readonly employeeService: EmployeeService,
    private readonly passwordHasher: PasswordHasher
  ) { }
  async login(loginPasswordDto: LoginPasswordDto) {
    // Create auth payload with redis {id, roles, userAgent, ip}
    const sessionIdRaw = this.tokenService.generate()
    const sessionIdHash = this.tokenService.digest(sessionIdRaw)

    const employeeRecord = await this.employeeService.findActiveByEmployeeNo(loginPasswordDto.employeeNumber)

    if (!employeeRecord) {
      throw new NotFoundException('Employee not found')
    }

    const passwordMatched = await this.passwordHasher.compare(loginPasswordDto.password, employeeRecord.passwordHash)

    if (!passwordMatched) {
      throw new UnauthorizedException('Invalid employee number or password')
    }

    let absoluteExpiresAt: number = Date.now() + RedisTtl.sessionAbsolute * 1000
    let sessionIdle: number = RedisTtl.sessionIdle
    let sessionAbsolute: number = RedisTtl.sessionAbsolute

    if (loginPasswordDto.remember) {
      absoluteExpiresAt = Date.now() + RedisTtl.sessionRememberMeAbsolute * 1000
      sessionIdle = RedisTtl.sessionIdleRememberMe
      sessionAbsolute = RedisTtl.sessionRememberMeAbsolute
    }

    await this.redis
      .multi()
      .set(
        RedisKeys.session(sessionIdHash),
        JSON.stringify({
          id: employeeRecord.id,
          roles: employeeRecord.roles,
          userAgent: '',
          ip: '',
          absoluteExpiresAt
        }),
        'EX',
        RedisTtl.sessionIdle
      )
      .sadd(
        RedisKeys.userSessions(employeeRecord.id),
        sessionIdHash,
      )
      .expire(
        RedisKeys.userSessions(employeeRecord.id),
        RedisTtl.sessionAbsolute, 'NX'
      ) // new set: give it a TTL
      .expire(
        RedisKeys.userSessions(employeeRecord.id),
        RedisTtl.sessionAbsolute, 'GT'
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
    
    return { sessionIdRaw, rememberMe: loginPasswordDto.remember }
  }
}

