import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import { ActiveStatus, InviteStatus } from '../generated/prisma/enums.js';

@Injectable()
export class PermissionRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>
  ) { }

  async getPermissionsByEmployeeId(employeeId: string) {
    return await this.txHost.tx.permission.findMany({
      where: {
        rolePermissions: {
          some: {
            role: {
              deletedAt: null,
              employeeRoles: {
                some: {
                  employeeId,
                  employee: { deletedAt: null, activeStatus: ActiveStatus.ACTIVE },
                },
              },
            },
          },
        },
      },
      select: { action: true, target: true },
    });
  }

}
