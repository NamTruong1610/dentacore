import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { CryptoModule } from '../common/crypto/crypto.module.js';
import { EmployeeModule } from '../employee/employee.module.js';
import { MfaModule } from '../mfa/mfa.module.js';
import { SessionStore } from './stores/session.store.js';
import { MfaChallengeStore } from './stores/mfa-challenge.store.js';
import { APP_GUARD } from '@nestjs/core';
import { SessionGuard } from './guards/session.guard.js';

@Module({
  imports: [CryptoModule, EmployeeModule, MfaModule],
  providers: [
    AuthService, SessionStore, MfaChallengeStore,
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
