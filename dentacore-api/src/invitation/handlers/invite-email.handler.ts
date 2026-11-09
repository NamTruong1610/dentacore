import { Injectable } from '@nestjs/common';
import { OnOutboxMessage, type OutboxHandlerContext } from '@nestjs/outbox';
import { Prisma } from '../../generated/prisma/client.js';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
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