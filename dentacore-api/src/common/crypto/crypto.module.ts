import { Module } from '@nestjs/common';
import { PasswordHasher } from './password-hasher.service.js';
import { TokenService } from './token.service.js';

@Module({
  providers: [PasswordHasher, TokenService],
  exports: [PasswordHasher, TokenService]
})
export class CryptoModule {}