import { Module } from '@nestjs/common';
import { MfaService } from './mfa.service.js';
import { MfaCredentialsRepository } from './mfa-credentials.repository.js';
import { CryptoModule } from '../common/crypto/crypto.module.js';

@Module({
  providers: [MfaService, MfaCredentialsRepository],
  exports: [MfaService],
  imports: [CryptoModule]
})
export class MfaModule {}
