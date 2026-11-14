import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../common/crypto/token.service.js';
import { REDIS_AUTH } from '../redis/redis.constants.js';
import { Redis } from 'ioredis';
import { RedisKeys, RedisTtl } from './stores/auth-redis.keys.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    @Inject(REDIS_AUTH) private readonly redis: Redis,
  ) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const sessionIdRaw = request.cookies['__Host-sid']
    if (typeof sessionIdRaw !== 'string' || sessionIdRaw === '') throw new UnauthorizedException();
    const sessionIdHash = this.tokenService.digest(sessionIdRaw)

    const rawPayload = await this.redis.get(RedisKeys.session(sessionIdHash))

    if (!rawPayload) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const parsedPayload = JSON.parse(rawPayload)

    // Slide or delete expired session
    const timeRemainingMs = parsedPayload.absoluteExpiresAt - Date.now()

    const sessionIdle = parsedPayload.rememberMe === true ? RedisTtl.sessionIdleRememberMe : RedisTtl.sessionIdle
    const timeRemainingSeconds = Math.floor(Math.min(timeRemainingMs, sessionIdle * 1000) / 1000)

    if (timeRemainingSeconds < 0) {
      await this.redis.del(RedisKeys.session(sessionIdHash))
      await this.redis.srem(RedisKeys.userSessions(parsedPayload.id), sessionIdHash)
      throw new UnauthorizedException('Session expired')
    }

    await this.redis.expire(RedisKeys.session(sessionIdHash), timeRemainingSeconds)
    

    // Set request.user
    request.user = {
      id: parsedPayload.id,
      roles: parsedPayload.roles,
      sessionIdHash,
    }

    return true;
  }
}
