import { Injectable } from '@nestjs/common';
import { MfaCredentialsRepository } from './mfa-credentials.repository.js';

@Injectable()
export class MfaCredentialsService {
  constructor(private readonly mfaRepo: MfaCredentialsRepository) { }

  async saveMfaCredentialsAtInvite(employeeId: string, encryptedSecret: string) {
    await this.mfaRepo.saveInviteMfaCredentials(employeeId, encryptedSecret)
  }
}
