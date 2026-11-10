import { TransactionHost } from "@nestjs-cls/transactional";
import { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InviteStatus } from "../generated/prisma/enums.js";

@Injectable()
export class InviteTokenRepository {
  constructor(private readonly txHost: TransactionHost<TransactionalAdapterPrisma>) { }

  findActiveInviteToken(tokenHash: string) {
    return this.txHost.tx.inviteToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        consumedAt: null,
        deletedAt: null,
        expiresAt: { gt: new Date() },
        employee: { inviteStatus: InviteStatus.INVITED, deletedAt: null },
      }
    })
  }

  createInviteToken(employeeId: string, employeeEmail: string, tokenHash: string, expiresAt: Date, issuerNationalId: string) {
    return this.txHost.tx.inviteToken.create({
      data: {
        employeeId,
        sentToEmail: employeeEmail,
        tokenHash,
        expiresAt,
        issuerNationalId,
      },
    })
  }

  consumeInviteTokenByHash(tokenHash: string) {
    const { count } = this.txHost.tx.inviteToken.updateMany({
      where: { tokenHash, consumedAt: null },
      data: {
        consumedAt: new Date()
      }
    })
    return count === 1
  }

}