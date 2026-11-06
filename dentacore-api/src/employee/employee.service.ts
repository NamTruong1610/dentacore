import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { InviteStatus } from '../generated/prisma/enums.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import * as crypto from 'crypto'
import { PasswordHasher } from '../common/crypto/password-hasher.service.js';
import { EmployeeNoGenerator } from '../common/crypto/employeeNo-generator.service.js';
import { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly employeeNoGenerator: EmployeeNoGenerator,
    private readonly passwordHasher: PasswordHasher
  ) { }

  async createUninvitedEmployee(createUserDto: CreateUserDto) {

    // Generate and hash password
    const passwordHash: string = await this.passwordHasher.hash(createUserDto.rawPassword)

    try {
      return await this.prismaService.employee.create({
        data: {
          nationalId: createUserDto.nationalId,
          passwordHash,
          firstName: createUserDto.firstName,
          middleName: createUserDto.middleName,
          lastName: createUserDto.lastName,
          primaryEmail: createUserDto.primaryEmail,
          employeeNumber: createUserDto.employeeNumber
        },
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          primaryEmail: true,
          inviteStatus: true,
        }
      })
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

  async hasUninvitedEmployeeWithEmail(email: string) {
    // Check if the email is valid: Found at least one employee with matching primary email or secondary email in emal list who's not deleted and not yet invited
    const employeeRecords = await this.prismaService.employee.findMany({
      select: {
        id: true,
        emails: {
          select: {
            email: true
          }
        }
      },
      where: {
        AND: [
          {
            OR:
              [
                {
                  primaryEmail:
                  {
                    equals: email,
                    mode: "insensitive"
                  }
                },
                {
                  emails:
                  {
                    some:
                    {
                      email:
                      {
                        equals: email,
                        mode: "insensitive"
                      }
                    }
                  }
                }
              ]
          },
          { deletedAt: null },
          { inviteStatus: InviteStatus.UNINVITED }
        ]
      }
    })

    if (employeeRecords.length > 1) {
      throw new ConflictException('Multiple with this email found')
    }

    const employee = employeeRecords[0];

    if (!employee) throw new NotFoundException('User not found');

    return employee

  }
}
