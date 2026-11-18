import { BadRequestException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RedisKeys, RedisTtl } from './auth-redis.keys.js';
import { TokenService } from '../../common/crypto/token.service.js';
import { REDIS_AUTH } from '../../redis/redis.constants.js';
import { Redis } from 'ioredis';
import { RedisUtils } from '../../redis/redis.utils.js';

const MAX_OTP_ATTEMPTS = 5

@Injectable()
export class MfaChallengeStore {
  constructor(
    @Inject(REDIS_AUTH) private readonly redis: Redis,
    private readonly tokenService: TokenService,
    private readonly redisUtils: RedisUtils
  ) { }

  private readonly logger = new Logger(MfaChallengeStore.name);

  async create(employeeId: string, rememberMe: boolean) {
    // Create pending mfa challenge
    const mfaChallengeIdRaw = this.tokenService.generate()
    const mfaChallengeIdHash = this.tokenService.digest(mfaChallengeIdRaw)

    const results = await this.redis
      .multi()
      .set(
        RedisKeys.mfaChallenge(mfaChallengeIdHash),
        JSON.stringify({
          employeeId,
          rememberMe
        }),
        'EX',
        RedisTtl.mfaChallenge
      )
      .set(
        RedisKeys.mfaAttempts(mfaChallengeIdHash),
        0,
        'EX',
        RedisTtl.mfaChallenge
      )
      .exec()

    this.redisUtils.assertExecOk(results, 'challenge created')


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
    const results = await this.redis
      .multi()
      .incr(RedisKeys.mfaAttempts(mfaChallengeIdHash))
      .expire(RedisKeys.mfaAttempts(mfaChallengeIdHash), RedisTtl.mfaChallenge, 'NX')
      .exec();
    this.redisUtils.assertExecOk(results, 'mfa attempt');
    const attempts = results![0][1] as number;
    if (attempts > MAX_OTP_ATTEMPTS) {
      await this.redis.del(RedisKeys.mfaChallenge(mfaChallengeIdHash))
      return false
    }
    return true;
  }
}

