import { TransactionHost } from "@nestjs-cls/transactional";
import { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client.js";

@Injectable()
export class MfaCredentialsRepository {
  constructor(private readonly txHost: TransactionHost<TransactionalAdapterPrisma>) { }

  async saveInviteMfaCredentials(employeeId: string, encryptedSecret: string, timeStep: number) {
    try {
      return await this.txHost.tx.mfaCredentials.create({
        data: { encryptedSecret, employeeId, lastUsedTimeStep: timeStep }
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
        if (error.code === "P2002") {
          const fields = (error.meta?.target as string[])?.join(', ');
          throw new ConflictException(`Invalid setup. Try again`);
        }
      }
      throw error;
    }

  }

  async findAndUpdateTimeStepMany(employeeId: string, newTimeStep: number) {
    const { count } = await this.txHost.tx.mfaCredentials.updateMany({
      where: {
        employeeId,
        OR: [{ lastUsedTimeStep: null }, { lastUsedTimeStep: { lt: newTimeStep } }],
      },
      data: { lastUsedTimeStep: newTimeStep },
    });

    return count === 1
  }

} 
