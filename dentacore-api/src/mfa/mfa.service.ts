import { Injectable } from '@nestjs/common';
import { generateSecret, verify, generateURI } from "otplib";
import { SecretCipherService } from '../common/crypto/secret-cipher.service.js';
import { MfaCredentialsRepository } from './mfa-credentials.repository.js';

@Injectable()
export class MfaService {
  constructor(
    private readonly secretCipher: SecretCipherService,
    private readonly mfaCredentialsRepo: MfaCredentialsRepository,
  ) { }

  createSecret() {
    return generateSecret();
  }
  
  buildOtpauthUri(label: string, rawSecret: string) {
    return generateURI({
      issuer: 'Dentacore',
      label,
      secret: rawSecret
    })
  }
  encryptSecret(employeeId: string, rawSecret: string): string {
    return this.secretCipher.encrypt(rawSecret, employeeId);
  }

  private decryptSecret(employeeId: string, encryptedSecret: string) {
    return this.secretCipher.decrypt(encryptedSecret, employeeId);
  }

  private async verifyTotpToken(mfaSecret: string, totpToken: string, lastUsedTimeStep: number | null) {
    const verificationObj = await verify({
      secret: mfaSecret,
      token: totpToken,
      strategy: "totp",
      epochTolerance: 30,
      afterTimeStep: lastUsedTimeStep ?? undefined
    })
    if (!verificationObj.valid || !('timeStep' in verificationObj)) {
      return { valid: false as const };
    }
    return { valid: true as const, timeStep: verificationObj.timeStep, delta: verificationObj.delta };
  }

  async saveCredentials(employeeId: string, encryptedSecret: string, firstTimeStep: number) {
    await this.mfaCredentialsRepo.create(employeeId, encryptedSecret, firstTimeStep)
  }

  async verifyEnrollmentOtp(employeeId: string, encryptedSecret: string, otp: string,
  ) {
    const rawSecret = this.decryptSecret(employeeId, encryptedSecret);
    return this.verifyTotpToken(rawSecret, otp, null);
  }

  async verifyAndClaim(employeeId: string, otp: string) {
    const mfaCredentialsRecord = await this.mfaCredentialsRepo.findByEmployeeId(employeeId)
    if (!mfaCredentialsRecord) return false;
    const mfaSecretRaw = this.decryptSecret(employeeId, mfaCredentialsRecord.encryptedSecret)

    const otpVerificationObj = await this.verifyTotpToken(mfaSecretRaw, otp, mfaCredentialsRecord.lastUsedTimeStep);
    if (!otpVerificationObj.valid) return false;

    const isValidTimeStep = await this.mfaCredentialsRepo.advanceLastUsedTimeStep(employeeId, otpVerificationObj.timeStep)

    if (!isValidTimeStep) {
      return false;
    }
    return true
  }
}
