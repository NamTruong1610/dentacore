import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller.js';
import { EmployeeService } from './employee.service.js';
import { CryptoModule } from '../common/crypto/crypto.module.js';
import { EmployeeRepository } from './employee.repository.js';
import { EmployeeNoGenerator } from './employee-number.generator.js';

@Module({
  controllers: [EmployeeController],
  providers: [EmployeeService, EmployeeRepository, EmployeeNoGenerator],
  exports: [EmployeeService],
  imports: [CryptoModule]
})
export class EmployeeModule { }
