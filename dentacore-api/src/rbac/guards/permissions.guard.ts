
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { PermissionCacheStore } from '../stores/permission-cache.store.js';
import { PermissionService } from '../permission.service.js';
import { RedisKeys } from '../stores/permission-redis.keys.js';


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
    const required = this.reflector.getAllAndOverride('permission', [context.getHandler(), context.getClass()]);

    if (!required) throw new ForbiddenException();

    const { action, target } = required

    const request = context.switchToHttp().getRequest();
    const { id } = request.user;

    // Get user payload from Redis cache store and match their role with permission
    // Check cache hit
    let permissionSet = await this.permissionStore.get(id)

    if (!permissionSet) {
      // Miss, load new cache
      const permissions = await this.permissionService.getPermissionsByEmployeeId(id)

      await this.permissionStore.create(id, permissions)

      permissionSet = await this.permissionStore.get(id)
    }
    // Match permission set with { action, target }
    if (!permissionSet?.has(`${action}:${target}`)) {
      throw new ForbiddenException();
    }

    return true
  }
}
