import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'node:crypto';


@Injectable()
export class TokenService {
  /** 256-bit opaque session ID, base64url (43 chars). Goes in the cookie. */
  generate(): string {
    return randomBytes(32).toString('base64url');
  }

  /** SHA-256 digest of the ID. Use this as the Redis key, never the raw ID. */
  digest(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}