import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service.js';
import { InvitationController } from './invitation.controller.js';
import { EmployeeModule } from '../employee/employee.module.js';
import { MailModule } from '../mail/mail.module.js';
import { CryptoModule } from '../common/crypto/crypto.module.js';
import { EmployeeRepository } from '../employee/employee.repository.js';
import { TokenService } from '../common/crypto/token.service.js';
import { InviteTokenRepository } from './invite.repository.js';
import { InviteEmailHandler } from './handlers/invite-email.handler.js';

@Module({
  imports: [EmployeeModule, MailModule, CryptoModule],
  providers: [InvitationService, EmployeeRepository, TokenService, InviteTokenRepository, InviteEmailHandler],
  controllers: [InvitationController]
})
export class InvitationModule {}
