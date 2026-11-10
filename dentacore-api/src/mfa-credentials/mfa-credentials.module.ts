import { Module } from '@nestjs/common';
import { MfaCredentialsService } from './mfa-credentials.service.js';

@Module({
  providers: [MfaCredentialsService]
})
export class MfaCredentialsModule {}
