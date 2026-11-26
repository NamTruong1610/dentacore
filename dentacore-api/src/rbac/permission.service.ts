import { Injectable } from '@nestjs/common';
import { PermissionRepository } from './permission.repository.js';

@Injectable()
export class PermissionService {
  constructor(
    private readonly permissionRepo: PermissionRepository
  ) {}

  async getPermissionsByEmployeeId(employeeId: string) {
    return await this.permissionRepo.getPermissionsByEmployeeId(employeeId)
  }
}
