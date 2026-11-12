import { Injectable } from '@nestjs/common';
import { generateSecret, generate, verify, generateURI } from "otplib";

@Injectable()
export class MfaService {
  async generateTotpToken(mfaSecret: string) {
    return await generate({ secret: mfaSecret })
  }

  async verifyTotpToken(mfaSecret: string, totpToken: string, lastUsedTimeStep: number | null) {
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

  generateUri(issuer: string, label: string, secret: string) {
    return generateURI({
      issuer,
      label,
      secret
    })
  }

  generateMfaSecret(): string {
    return generateSecret();
  }
}