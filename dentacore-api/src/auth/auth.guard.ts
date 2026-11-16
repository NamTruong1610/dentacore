import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../common/crypto/token.service.js';
import { REDIS_AUTH } from '../redis/redis.constants.js';
import { Redis } from 'ioredis';
import { RedisKeys, RedisTtl } from './stores/auth-redis.keys.js';
import { SessionStore } from './stores/session.store.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly sessionStore: SessionStore,
    @Inject(REDIS_AUTH) private readonly redis: Redis,
  ) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const sessionIdRaw = request.cookies['__Host-sid']
    if (typeof sessionIdRaw !== 'string' || sessionIdRaw === '') throw new UnauthorizedException();
    const sessionIdHash = this.tokenService.digest(sessionIdRaw)

    const parsedPayload = await this.sessionStore.validateAndSlide(sessionIdHash)

    if (!parsedPayload) throw new UnauthorizedException();

    // Set request.user
    request.user = {
      id: parsedPayload.id
    }

    return true;
  }
}
