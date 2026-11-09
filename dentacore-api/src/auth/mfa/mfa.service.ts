import { Injectable } from '@nestjs/common';
import { generateSecret, generate, verify, generateURI } from "otplib";

interface totpVerificationObj {
  valid: boolean,
  delta?: number
}

@Injectable()
export class MfaService {
  async generateTotpToken(mfaSecret: string) {
    return await generate({ secret: mfaSecret })
  }

  async verifyTotpToken(mfaSecret: string, totpToken: string): Promise<totpVerificationObj> {
    return await verify({ secret: mfaSecret, token: totpToken })
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