import { Injectable } from '@nestjs/common';
import { PermissionRepository } from './permission.repository.js';
import { PermissionCacheStore } from './stores/permission-cache.store.js';

@Injectable()
export class PermissionService {
  constructor(
    private readonly permissionRepo: PermissionRepository,
    private readonly permissionStore: PermissionCacheStore,

  ) {}

  async getPermissionsByEmployeeId(employeeId: string) {

    const permissionSet = await this.permissionStore.get(employeeId)

    if (permissionSet) return permissionSet

    const permissionRecords = await this.permissionRepo.getPermissionsByEmployeeId(employeeId)

    const permKeys: string[] = []

    for (const perm of permissionRecords) {
      if (perm) permKeys.push(`${perm.action}:${perm.target}`)
    }

    await this.permissionStore.create(employeeId, permKeys)

    return new Set<string>(permKeys)
  }
}
