import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service.js';
import { InvitationController } from './invitation.controller.js';
import { EmployeeModule } from '../employee/employee.module.js';
import { MailModule } from '../mail/mail.module.js';
import { CryptoModule } from '../common/crypto/crypto.module.js';
import { InviteTokenRepository } from './invite-token.repository.js';
import { InviteEmailHandler } from './handlers/invite-email.handler.js';
import { AuthModule } from '../auth/auth.module.js';
import { MfaCredentialsModule } from '../mfa-credentials/mfa-credentials.module.js';

@Module({
  imports: [EmployeeModule, MailModule, CryptoModule, AuthModule, MfaCredentialsModule],
  providers: [InvitationService, InviteTokenRepository, InviteEmailHandler],
  controllers: [InvitationController]
})
export class InvitationModule {}
