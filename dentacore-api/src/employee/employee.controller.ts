import { Controller } from '@nestjs/common';
import { EmployeeService } from './employee.service.js';

@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {

  }

  
}
