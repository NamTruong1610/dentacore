import { TransactionHost } from "@nestjs-cls/transactional";
import { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InviteStatus } from "../generated/prisma/enums.js";
import { CreateUserDto } from "./dto/create-user.dto.js";


@Injectable()
export class EmployeeRepository {
  constructor(private readonly txHost: TransactionHost<TransactionalAdapterPrisma>) { }

  async createUninvitedEmployee(createUserDto: CreateUserDto) {

    return await this.txHost.tx.employee.create({
      data: {
        nationalId: createUserDto.nationalId,
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
  }


  // Check if the email is valid: Found at least one employee with matching primary email or secondary email in emal list who's not deleted and not yet invited
  async findUninvitedByEmail(email: string) {
    return await this.txHost.tx.employee.findMany({
      select: { id: true },
      where: {
        OR: [
          { primaryEmail: { equals: email, mode: 'insensitive' } },
          { emails: { some: { email: { equals: email, mode: 'insensitive' } } } },
        ],
        deletedAt: null,
        inviteStatus: InviteStatus.UNINVITED,
      },
      take: 2,
    });
  }

  async findInvitable(id: string) {
    return await this.txHost.tx.employee.findFirst({
      where: { id, inviteStatus: InviteStatus.INVITED, deletedAt: null },
    });
  }

  async markInvited(id: string) {
    const { count } = await this.txHost.tx.employee.updateMany({
      where: { id, inviteStatus: InviteStatus.UNINVITED, deletedAt: null },
      data: { inviteStatus: InviteStatus.INVITED },
    });
    return count === 1;
  }
}