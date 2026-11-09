import { Injectable } from '@nestjs/common';
import { generateSecret, generate, verify, generateURI } from "otplib";
import { randomBytes, createHash } from 'node:crypto';

interface totpVerificationObj {
  valid: boolean,
  delta?: number
}

@Injectable()
export class TokenService {
  /** 256-bit opaque session ID, base64url (43 chars). Goes in the cookie. */
  generate(): string {
    return randomBytes(32).toString('base64url');
  }

  async generateTotpToken(mfaSecret: string) {
    return await generate({ secret: mfaSecret })
  }

  async verifyTotpToken(mfaSecret: string, totpToken: string): Promise<totpVerificationObj> {
    return await verify({secret: mfaSecret, token: totpToken})
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

  /** SHA-256 digest of the ID. Use this as the Redis key, never the raw ID. */
  digest(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}