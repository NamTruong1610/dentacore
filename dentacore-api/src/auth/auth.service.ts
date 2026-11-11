import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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

    const passwordMatched = await this.passwordHasher.compare(loginPasswordDto.password, employeeRecord.passwordHash)

    if (!passwordMatched) {
      throw new BadRequestException('Invalid employee number or password')
    }

    // "Remember me" switched off
    if (!loginPasswordDto.remember) {
      await this.redis
        .multi()
        .set(
          RedisKeys.session(sessionIdHash),
          JSON.stringify({
            id: employeeRecord.id,
            roles: employeeRecord.roles,
            userAgent: '',
            ip: '',
            absoluteExpiresAt: Date.now() + RedisTtl.sessionAbsolute
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

    }

    else {
      await this.redis
        .multi()
        .set(
          RedisKeys.session(sessionIdHash),
          JSON.stringify({
            id: employeeRecord.id,
            roles: employeeRecord.roles,
            userAgent: '',
            ip: '',
            absoluteExpiresAt: Date.now() + RedisTtl.sessionRememberMeAbsolute
          }),
          'EX',
          RedisTtl.sessionIdleRememberMe
        )
        .sadd(
          RedisKeys.userSessions(employeeRecord.id),
          sessionIdHash
        )
        .expire(
          RedisKeys.userSessions(employeeRecord.id), 
          RedisTtl.sessionRememberMeAbsolute, 'NX'
        ) // new set: give it a TTL
        .expire(
          RedisKeys.userSessions(employeeRecord.id), 
          RedisTtl.sessionRememberMeAbsolute, 'GT'
        )
        .exec()
    }

    return { sessionIdRaw, rememberMe: loginPasswordDto.remember }

  }
}
