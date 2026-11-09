import { Injectable } from '@nestjs/common';
import { OnOutboxMessage, type OutboxHandlerContext } from '@nestjs/outbox';
// import { Prisma } from '@prisma/client/extension';
import { TokenService } from '../../common/crypto/token.service.js';
import { InviteStatus } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MailService } from '../../mail/mail.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { EmployeeService } from '../../employee/employee.service.js';
import { InvitationService } from '../invitation.service.js';

type InvitePayload = { employeeId: string; email: string; issuerNationalId: string };

@Injectable()
export class InviteEmailHandler {

  constructor(
    private readonly invitationService: InvitationService,
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>
  ) { }

  // middleware: { mount: true } sets up the context for HTTP requests only. Outbox handlers don’t arrive through HTTP. If you get a “no active CLS context” error in the handler, add @UseCls() to handle()
  @OnOutboxMessage('employee.invited', { consumer: 'invite-email' })
  async handleInvite(msg: InvitePayload, ctx: OutboxHandlerContext<Prisma.TransactionClient>) {
    await this.txHost.withTransaction({ timeout: 15_000 }, async() =>
      ctx.processInTransaction(this.txHost.tx, () => this.invitationService.issueInvite(msg)),
    );
  }

}