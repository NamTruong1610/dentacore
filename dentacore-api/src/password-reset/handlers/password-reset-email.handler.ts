import { Injectable } from '@nestjs/common';
import { OnOutboxMessage, type OutboxHandlerContext } from '@nestjs/outbox';
import { Prisma } from '../../generated/prisma/client.js';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { PasswordResetService } from '../password-reset.service.js';


@Injectable()
export class InviteEmailHandler {

  constructor(
    private readonly passwordResetService: PasswordResetService,
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>
  ) { }

  // middleware: { mount: true } sets up the context for HTTP requests only. Outbox handlers don’t arrive through HTTP. If you get a “no active CLS context” error in the handler, add @UseCls() to handle()
  @OnOutboxMessage('password-reset.requested', { consumer: 'password-reset-email' })
  async handleInvite(
    msg: { 
      employeeId: string,
      email: string, 
      employeeNumber: string 
    },
    ctx: OutboxHandlerContext<Prisma.TransactionClient>
  ) {
    await this.txHost.withTransaction({ timeout: 15_000 }, async () =>
      ctx.processInTransaction(this.txHost.tx, () => this.passwordResetService.issuePasswordReset(msg)),
    );
  }

}