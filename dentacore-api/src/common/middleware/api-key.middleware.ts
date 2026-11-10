import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express'
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  private readonly apiKey: Buffer;

  constructor(config: ConfigService) {
    this.apiKey = Buffer.from(config.getOrThrow<string>('DENTACORE_API_KEY'));
  }

  use(req: Request, res: Response, next: NextFunction) {
    const provided = req.headers['x-api-key'];
    const a = Buffer.from(typeof provided === 'string' ? provided : '');
    if (a.length !== this.apiKey.length || !timingSafeEqual(a, this.apiKey)) {
      throw new UnauthorizedException('Invalid API key');
    }
    next();
  }
}