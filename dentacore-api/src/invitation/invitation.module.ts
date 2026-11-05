import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service.js';
import { InvitationController } from './invitation.controller.js';
import { MailService } from './mail.service.js';

@Module({
  providers: [InvitationService, MailService],
  controllers: [InvitationController]
})
export class InvitationModule {}
