import { Module } from '@nestjs/common';
import { PasswordHasher } from './password-hasher.service.js';
import { TokenService } from './token.service.js';
import { SecretCipherService } from './secret-cipher.service.js';


@Module({
  providers: [PasswordHasher, TokenService, SecretCipherService],
  exports: [PasswordHasher, TokenService, SecretCipherService]
})
export class CryptoModule {}