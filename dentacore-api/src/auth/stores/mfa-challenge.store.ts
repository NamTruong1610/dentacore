import { BadRequestException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RedisKeys, RedisTtl } from './auth-redis.keys.js';
import { TokenService } from '../../common/crypto/token.service.js';
import { REDIS_AUTH } from '../../redis/redis.constants.js';
import { Redis } from 'ioredis';

const MAX_OTP_ATTEMPTS = 5

@Injectable()
export class MfaChallengeStore {
  constructor(
    @Inject(REDIS_AUTH) private readonly redis: Redis,
    private readonly tokenService: TokenService,
  ) { }

  private readonly logger = new Logger(MfaChallengeStore.name);

  async create(employeeId: string, rememberMe: boolean) {
    // Create pending mfa challenge
    const mfaChallengeIdRaw = this.tokenService.generate()
    const mfaChallengeIdHash = this.tokenService.digest(mfaChallengeIdRaw)
    await this.redis.set(
      RedisKeys.mfaChallenge(mfaChallengeIdHash),
      JSON.stringify({
        employeeId,
        rememberMe
      }),
      'EX',
      RedisTtl.mfaChallenge
    )
    return mfaChallengeIdRaw
  }
  async get(mfaChallengeIdHash: string) {
    const rawPayload = await this.redis.get(RedisKeys.mfaChallenge(mfaChallengeIdHash))
    if (!rawPayload) return null
    else return JSON.parse(rawPayload)
  }
  async consume(mfaChallengeIdHash: string) {
    const consumed = await this.redis.del(RedisKeys.mfaChallenge(mfaChallengeIdHash))
    if (consumed === 1) return true;
    else return false
  }

  async registerAttempt(mfaChallengeIdHash: string) {
    const attempts = await this.redis.incr(mfaChallengeIdHash)
    if (attempts > MAX_OTP_ATTEMPTS) {
      await this.redis.del(RedisKeys.mfaChallenge(mfaChallengeIdHash))
      return false
    }
  }
}

