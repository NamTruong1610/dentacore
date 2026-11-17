import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../../common/crypto/token.service.js';
import { SessionStore } from '../stores/session.store.js';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly sessionStore: SessionStore
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
