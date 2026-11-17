import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { CryptoModule } from '../common/crypto/crypto.module.js';
import { EmployeeModule } from '../employee/employee.module.js';
import { MfaModule } from '../mfa/mfa.module.js';
import { MfaService } from '../mfa/mfa.service.js';
import { SessionStore } from './stores/session.store.js';
import { MfaChallengeStore } from './stores/mfa-challenge.store.js';

@Module({
  imports: [CryptoModule, EmployeeModule, MfaModule],
  providers: [AuthService, MfaService, SessionStore, MfaChallengeStore],
  controllers: [AuthController],
  exports: [MfaService]
})
export class AuthModule {}
