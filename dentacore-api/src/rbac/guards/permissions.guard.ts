
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_EMPLOYEE_KEY } from '../decorators/role.decorator.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.getAllAndOverride(IS_EMPLOYEE_KEY, [context.getHandler(), context.getClass()]);
    if (!roles) {
      throw new UnauthorizedException();
    }
    const request = context.switchToHttp().getRequest();
    const { id } = request.user;
    

    return true
  }
}
