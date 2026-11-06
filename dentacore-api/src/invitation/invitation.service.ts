import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmployeeService } from '../employee/employee.service.js';
import { InviteStatus } from '../generated/prisma/enums.js';
import { Prisma } from '../generated/prisma/client.js';
import { Outbox } from '@nestjs/outbox';

@Injectable()
export class InvitationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly employeeService: EmployeeService,
    private readonly outbox: Outbox<Prisma.TransactionClient>
  ) { }

  private INVITE_DURATION: number = 7 * 24 * 60 * 60 * 1000;

  async inviteEmployee(email: string) {
    const employeeRecord = await this.employeeService.hasUninvitedEmployeeWithEmail(email)

    // If employee exists: 
    // – Send email
    // – Switch invite status to invited
    // - Create Invite token 
    // This transaction use updateMany and count to guard because update locks down the row so 2 transactions seeing the uninvited users can't write at the same time. After one succeeds, the other one throws an error due to the user's invite status being changed to INVITED
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
        await this.outbox.add(tx, {
          topic: 'employee.invited',
          key: employeeRecord.id,
          payload: { employeeId: employeeRecord.id, email, issuerNationalId: 'request-user-id-placeholder' },
        });
      }
    )

    this.outbox.notify();
  }

}
