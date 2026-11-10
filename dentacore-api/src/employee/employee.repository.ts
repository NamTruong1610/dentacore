import { TransactionHost } from "@nestjs-cls/transactional";
import { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ActiveStatus, InviteStatus } from "../generated/prisma/enums.js";
import { CreateEmployeeDto } from "./dto/create-employee.dto.js";
import { Prisma } from "../generated/prisma/client.js";


@Injectable()
export class EmployeeRepository {
  constructor(private readonly txHost: TransactionHost<TransactionalAdapterPrisma>) { }

  async createUninvitedEmployee(createEmployeeDto: CreateEmployeeDto) {
    try {
      return await this.txHost.tx.employee.create({
        data: {
          nationalId: createEmployeeDto.nationalId,
          firstName: createEmployeeDto.firstName,
          middleName: createEmployeeDto.middleName,
          lastName: createEmployeeDto.lastName,
          primaryEmail: createEmployeeDto.primaryEmail,
          employeeNumber: createEmployeeDto.employeeNumber
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

  async savePasswordHash(id: string, passwordHash: string) {
    const { count } = await this.txHost.tx.employee.updateMany({
      where: { id, inviteStatus: InviteStatus.INVITED, activeStatus: ActiveStatus.INACTIVE },
      data: {
        passwordHash,
        activeStatus: ActiveStatus.ACTIVE
      }
    })
    return count === 1
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