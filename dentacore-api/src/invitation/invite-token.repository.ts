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

  createInviteToken(employeeId: string, tokenHash: string, expiresAt: Date, issuerNationalId: string) {
    return this.txHost.tx.inviteToken.create({
      data: {
        employeeId,
        tokenHash,
        expiresAt,
        issuerNationalId,
      },
    })
  }
}