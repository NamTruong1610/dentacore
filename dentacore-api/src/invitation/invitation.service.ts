import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmployeeService } from '../employee/employee.service.js';
import { InviteStatus } from '../generated/prisma/enums.js';
import { Prisma } from '../generated/prisma/client.js';
import { TokenService } from '../common/crypto/token.service.js';
import { MailService } from './mail.service.js';

@Injectable()
export class InvitationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly employeeService: EmployeeService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService
  ) { }

  private INVITE_DURATION: number = 7 * 24 * 60 * 60 * 1000;

  async inviteEmployee(email: string) {
    const employeeRecord = await this.employeeService.hasUninvitedEmployeeWithEmail(email) 

    // If employee exists: 
    // – Send email
    // – Switch invite status to invited
    // - Create Invite token 
    // This transaction use updateMany and count to guard because update locks down the row so 2 transactions seeing the uninvited users can't write at the same time. After one succeeds, the other one throws an error due to the user's invite status being changed to INVITED
    const rawToken = this.tokenService.generate()
    const tokenHash = this.tokenService.digest(rawToken)
    await this.prismaService.$transaction(
      async (tx) => {
        const { count } = await tx.employee.updateMany({
          where: {
            id: employeeRecord.id,
            inviteStatus: InviteStatus.UNINVITED,
            deletedAt: null
          },
          data: {
            inviteStatus: InviteStatus.INVITED
          }
        })
        if (count == 0) throw new ConflictException('Employee already invited or removed');
        await tx.inviteToken.create({
          data: {
            employeeId: employeeRecord.id,
            tokenHash,
            expiresAt: new Date(Date.now() + this.INVITE_DURATION),
            issuerNationalId: 'request-user-id-placeholder'
          }
        })
      }
    )

    // Send invite email
    this.mailService.sendInvite(email,`http://localhost:3000/invite/accept?token=${rawToken}`)
  }

}
