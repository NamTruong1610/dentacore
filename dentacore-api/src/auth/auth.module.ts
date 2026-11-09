import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { MfaService } from './mfa/mfa.service.js';

@Module({
  providers: [AuthService, MfaService],
  controllers: [AuthController],
  exports: [MfaService]
})
export class AuthModule {}
