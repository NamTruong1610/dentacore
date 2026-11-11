import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { MfaService } from './mfa/mfa.service.js';
import { CryptoModule } from '../common/crypto/crypto.module.js';
import { EmployeeModule } from '../employee/employee.module.js';

@Module({
  imports: [CryptoModule, EmployeeModule],
  providers: [AuthService, MfaService],
  controllers: [AuthController],
  exports: [MfaService]
})
export class AuthModule {}
