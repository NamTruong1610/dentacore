import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { InviteStatus } from '../generated/prisma/enums.js';
import { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class EmployeeService {
  constructor(private readonly prismaService: PrismaService) { }

  createUninvitedEmployee(email: string) { }

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
              { primaryEmail: 
                {
                  equals: email,
                  mode: "insensitive"
                } 
              },
              { emails:
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
