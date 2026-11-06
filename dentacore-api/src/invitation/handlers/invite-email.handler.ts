import { Injectable } from '@nestjs/common';
import { OnOutboxMessage, type OutboxHandlerContext } from '@nestjs/outbox';
// import { Prisma } from '@prisma/client/extension';
import { TokenService } from '../../common/crypto/token.service.js';
import { InviteStatus } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MailService } from '../../mail/mail.service.js';
import { Prisma } from '../../generated/prisma/client.js';

type InvitePayload = { employeeId: string; email: string; issuerNationalId: string };

@Injectable()
export class InviteEmailHandler {
  private INVITE_DURATION = 7 * 24 * 60 * 60 * 1000;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
  ) {}

  @OnOutboxMessage('employee.invited', { consumer: 'invite-email' })
  async sendInvite(msg: InvitePayload, ctx: OutboxHandlerContext<Prisma.TransactionClient>) {
    await this.prismaService.$transaction(
      async (tx) => {
        await ctx.processInTransaction(tx, async () => {
          const employee = await tx.employee.findFirst({
            where: { id: msg.employeeId, inviteStatus: InviteStatus.INVITED, deletedAt: null },
          });
          if (!employee) return; // deleted or cancelled since it was queued

          const rawToken = this.tokenService.generate();
          await tx.inviteToken.create({
            data: {
              employeeId: msg.employeeId,
              tokenHash: this.tokenService.digest(rawToken),
              expiresAt: new Date(Date.now() + this.INVITE_DURATION),
              issuerNationalId: msg.issuerNationalId,
            },
          });

          await this.mailService.sendInvite(
            msg.email,
            `http://localhost:3000/invite/accept?token=${rawToken}`,
          ); // throws → whole transaction rolls back → retried with backoff
        });
      },
      { timeout: 15000 }, // Prisma's default is 5s; leave room for the email call
    );
  }
}