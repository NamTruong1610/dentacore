import { Inject, Injectable } from '@nestjs/common';
import { LoginPasswordDto } from './dto/login-password.dto.js';
import { Redis } from 'ioredis';
import { REDIS_AUTH } from '../redis/redis.constants.js';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { RedisKeys, RedisTtl } from './stores/auth-redis.keys.js';
import { TokenService } from '../common/crypto/token.service.js';
import { EmployeeService } from '../employee/employee.service.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(REDIS_AUTH) private readonly redis: Redis,
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
    private readonly tokenService: TokenService,
    private readonly employeeService: EmployeeService
  ) { }
  async login(loginPasswordDto: LoginPasswordDto) {
    // Create auth payload with redis{id, roles, permissions, userAgent, ip}
    const sessionIdRaw = this.tokenService.generate()
    const sessionIdHash = this.tokenService.digest(sessionIdRaw)

    const employeeRecord = await this.employeeService.findActiveByEmployeeNo(loginPasswordDto.employeeNumber)

    // "Remember me" switched off
    if (!loginPasswordDto.remember) {
      this.redis
        .multi()
        .set(
          RedisKeys.session(sessionIdHash),
          JSON.stringify({
            id: employeeRecord.id,
            roles: employeeRecord.roles,
            userAgent: '',
            ip: '',
            absoluteExpiresAt: RedisTtl.sessionAbsolute
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
          RedisTtl.sessionAbsolute
        )

    }

    else {
      this.redis
        .multi()
        .set(
          RedisKeys.session(sessionIdHash),
          JSON.stringify({
            id: employeeRecord.id,
            roles: employeeRecord.roles,
            userAgent: '',
            ip: '',
            absoluteExpiresAt: RedisTtl.sessionRememberMeAbsolute
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
          RedisTtl.sessionRememberMeAbsolute
        )
    }

    return { sessionIdRaw, rememberMe: loginPasswordDto.remember }

  }
}
