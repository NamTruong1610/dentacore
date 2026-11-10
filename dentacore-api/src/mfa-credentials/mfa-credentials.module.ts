import { Module } from '@nestjs/common';
import { MfaCredentialsService } from './mfa-credentials.service.js';
import { MfaCredentialsRepository } from './mfa-credentials.repository.js';

@Module({
  providers: [MfaCredentialsService, MfaCredentialsRepository],
  exports: [MfaCredentialsService]
})
export class MfaCredentialsModule {}
