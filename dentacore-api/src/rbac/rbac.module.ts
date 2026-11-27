import { Module } from '@nestjs/common';
import { PermissionRepository } from './permission.repository.js';
import { PermissionService } from './permission.service.js';
import { PermissionCacheStore } from './stores/permission-cache.store.js';
import { PermissionsGuard } from './guards/permissions.guard.js';

@Module({
  providers: [PermissionRepository, PermissionService, PermissionCacheStore, PermissionsGuard],
  exports: [PermissionService, PermissionsGuard],
})
export class RbacModule {}
