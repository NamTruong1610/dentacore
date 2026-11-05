import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const COST = 12;

@Injectable()
export class PasswordHasher {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, COST);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  /** True if the hash was made with an older cost. Rehash on successful login. */
  needsRehash(hash: string): boolean {
    return bcrypt.getRounds(hash) !== COST;
  }
}