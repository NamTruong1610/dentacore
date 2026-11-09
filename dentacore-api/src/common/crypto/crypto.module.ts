import { Module } from '@nestjs/common';
import { PasswordHasher } from './password-hasher.service.js';
import { TokenService } from './token.service.js';
import { EmployeeNoGenerator } from './employeeNo-generator.service.js';

@Module({
  providers: [PasswordHasher, TokenService, EmployeeNoGenerator],
  exports: [PasswordHasher, TokenService, EmployeeNoGenerator]
})
export class CryptoModule {}