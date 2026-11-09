import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { PasswordHasher } from '../common/crypto/password-hasher.service.js';
import { EmployeeRepository } from './employee.repository.js';
import { Prisma } from '../generated/prisma/client.js';


@Injectable()
export class EmployeeService {
  constructor(
    private readonly employeeRepo: EmployeeRepository
  ) { }

  async createUninvitedEmployee(createEmployeeDto: CreateEmployeeDto) {
    await this.employeeRepo.createUninvitedEmployee(createEmployeeDto);
  }
}
