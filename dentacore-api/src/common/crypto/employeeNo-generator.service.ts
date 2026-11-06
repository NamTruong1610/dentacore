import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto'


@Injectable()
export class EmployeeNoGenerator {
  /** 256-bit opaque session ID, base64url (43 chars). Goes in the cookie. */
  generate() { return crypto.randomInt(0, 10 ** 8 - 1).toString().padStart(8, "0") }
}