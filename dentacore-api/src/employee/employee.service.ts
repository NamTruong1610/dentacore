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

  async findUninvitedByEmail(email: string) {
    return await this.employeeRepo.findUninvitedByEmail(email)
  }

  async findInvitable(id: string) {
    return await this.employeeRepo.findInvitable(id)
  }

  async findActiveByEmployeeNo(employeeNo: string) {
    return await this.employeeRepo.findActiveEmployeeByEmployeeNumber(employeeNo)
  }

  async markInvited(id: string) {
    return await this.employeeRepo.markInvited(id)
  }

  async activateWithPasswordHash(id: string, passwordHash: string) {
    return await this.employeeRepo.savePasswordHash(id, passwordHash)
  }
}
