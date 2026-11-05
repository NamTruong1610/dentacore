import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { InviteStatus } from '../generated/prisma/enums.js';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) { }

  createUninvitedEmployee(email: string) { }

  async hasUninvitedEmployeeWithEmail(email: string) {
    // Check if the email is valid:
    // – Finds at least one employee with matching primary email or secondary email in emal list who's not deleted and not yet invited
    const employeeExists = await this.prismaService.employee.findFirst({
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
    if (!employeeExists) {
      throw
    }
  }
}
