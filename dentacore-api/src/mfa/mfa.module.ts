import { Module } from '@nestjs/common';
import { MfaService } from './mfa.service.js';
import { MfaCredentialsRepository } from './mfa-credentials.repository.js';

@Module({
  providers: [MfaService, MfaCredentialsRepository]
})
export class MfaModule {}
