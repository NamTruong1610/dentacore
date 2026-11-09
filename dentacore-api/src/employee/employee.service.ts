import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto.js';
import { PasswordHasher } from '../common/crypto/password-hasher.service.js';
import { EmployeeRepository } from './employee.repository.js';
import { Prisma } from '../generated/prisma/client.js';


@Injectable()
export class EmployeeService {
  constructor(
    private readonly employeeRepo: EmployeeRepository
  ) { }

  async createUninvitedEmployee(createUserDto: CreateUserDto) {
    try {
      await this.employeeRepo.createUninvitedEmployee(createUserDto);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
        if (error.code === "P2002") {
          const fields = (error.meta?.target as string[])?.join(', ');
          throw new ConflictException(`A record with this ${fields} already exists`);
        }
      }
      throw error;
    }
  }

}
