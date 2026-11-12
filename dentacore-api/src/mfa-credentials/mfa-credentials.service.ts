import { Injectable } from '@nestjs/common';
import { MfaCredentialsRepository } from './mfa-credentials.repository.js';

@Injectable()
export class MfaCredentialsService {
  constructor(private readonly mfaRepo: MfaCredentialsRepository) { }

  async saveMfaCredentialsAtInvite(employeeId: string, encryptedSecret: string, timeStep: number) {
    await this.mfaRepo.saveInviteMfaCredentials(employeeId, encryptedSecret, timeStep)
  }

  async isOtpValidByTimeStep(employeeId: string, newTimeStep: number) {
    return await this.mfaRepo.findAndUpdateTimeStepMany(employeeId, newTimeStep)
  }
}
