import { Module } from '@nestjs/common';
import { PermissionRepository } from './permission.repository.js';
import { PermissionService } from './permission.service.js';

@Module({
  providers: [PermissionRepository, PermissionService]
})
export class RbacModule {}
