import { Module } from '@nestjs/common';
import { PasswordResetController } from './password-reset.controller.js';
import { PasswordResetService } from './password-reset.service.js';
import { EmployeeModule } from '../employee/employee.module.js';
import { MfaModule } from '../mfa/mfa.module.js';
import { CryptoModule } from '../common/crypto/crypto.module.js';
import { MailModule } from '../mail/mail.module.js';
import { PasswordResetRepository } from './password-reset.repository.js';
import { PasswordResetEmailHandler } from './handlers/password-reset-email.handler.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  controllers: [PasswordResetController],
  providers: [PasswordResetService, PasswordResetRepository, PasswordResetEmailHandler],
  imports: [EmployeeModule, MfaModule, CryptoModule, MailModule, AuthModule]
})
export class PasswordResetModule {}
