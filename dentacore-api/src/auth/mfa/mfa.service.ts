import { Injectable } from '@nestjs/common';
import { generateSecret, generate, verify, generateURI } from "otplib";

@Injectable()
export class MfaService {
  async generateTotpToken(mfaSecret: string) {
    return await generate({ secret: mfaSecret })
  }

  async verifyTotpToken(mfaSecret: string, totpToken: string) {
    const verificationObj = await verify({ secret: mfaSecret, token: totpToken })
    return verificationObj.valid === true
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