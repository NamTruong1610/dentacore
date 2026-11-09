import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { managedNonce, utf8ToBytes, bytesToUtf8 } from '@noble/ciphers/utils.js';



@Injectable()
export class SecretCipherService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    this.key = Buffer.from(config.getOrThrow<string>('TOTP_ENC_KEY'), 'base64');
  }


  encrypt(plain: string, aad: string): string {
    const box = managedNonce(xchacha20poly1305)(this.key, utf8ToBytes(aad));
    return Buffer.from(box.encrypt(utf8ToBytes(plain))).toString('base64');
  }

  decrypt(stored: string, aad: string): string {
    const box = managedNonce(xchacha20poly1305)(this.key, utf8ToBytes(aad));
    return bytesToUtf8(box.decrypt(Buffer.from(stored, 'base64'))); // throws on any mismatch
  }

}