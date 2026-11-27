
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionCacheStore } from '../stores/permission-cache.store.js';
import { PermissionService } from '../permission.service.js';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator.js';


@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionStore: PermissionCacheStore,
    private readonly permissionService: PermissionService
  ) { }
  async canActivate(
    context: ExecutionContext,
  ) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;
    
    const required = this.reflector.getAllAndOverride('permission', [context.getHandler(), context.getClass()]);

    if (!required) throw new ForbiddenException();

    const { action, target } = required

    const request = context.switchToHttp().getRequest();
    const { id } = request.user;

    const permissionSet = await this.permissionService.getPermissionsByEmployeeId(id)

    // Match permission set with { action, target }
    if (!permissionSet.has(`${action}:${target}`)) {
      throw new ForbiddenException();
    }

    return true
  }
}
