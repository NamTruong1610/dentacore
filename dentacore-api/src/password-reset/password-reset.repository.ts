import { TransactionHost } from "@nestjs-cls/transactional";
import { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";
import { Injectable } from "@nestjs/common";
import { ActiveStatus, InviteStatus } from "../generated/prisma/enums.js";

@Injectable()
export class PasswordResetRepository {
  constructor(private readonly txHost: TransactionHost<TransactionalAdapterPrisma>) { }

  findActive(tokenHash: string) {
    return this.txHost.tx.passwordResetToken.findFirst({
      select: {
        employeeId: true,
        expiresAt: true,
        sentToEmail: true
      },
      where: {
        tokenHash,
        revokedAt: null,
        consumedAt: null,
        deletedAt: null,
        expiresAt: { gt: new Date() },
        employee: { activeStatus: ActiveStatus.ACTIVE, deletedAt: null },
      }
    })
  }

  createToken(employeeId: string, sentToEmail: string, tokenHash: string, expiresAt: Date) {
    return this.txHost.tx.passwordResetToken.create({
      data: {
        employeeId,
        sentToEmail,
        tokenHash,
        expiresAt
      },
    })
  }

  async consumeByHash(tokenHash: string) {
    const { count } = await this.txHost.tx.passwordResetToken.updateMany({
      where: { tokenHash, consumedAt: null },
      data: {
        consumedAt: new Date()
      }
    })
    return count === 1
  }

}