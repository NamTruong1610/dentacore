import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller.js';
import { EmployeeService } from './employee.service.js';
import { CryptoModule } from '../common/crypto/crypto.module.js';
import { EmployeeRepository } from './employee.repository.js';

@Module({
  controllers: [EmployeeController],
  providers: [EmployeeService, EmployeeRepository],
  exports: [EmployeeService],
  imports: [CryptoModule]
})
export class EmployeeModule { }
