import { BadRequestException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { TokenService } from '../../common/crypto/token.service.js';
import { REDIS_AUTH } from '../../redis/redis.constants.js';
import { Redis } from 'ioredis';
import { RedisKeys, RedisTtl } from '../../auth/stores/auth-redis.keys.js';

interface PendingActivation {
  passwordHash: string,
  encryptedSecret: string,
  inviteTokenExpiresAt: Date,
  employeeId: string
}

@Injectable()
export class PendingInvitationStore {
  constructor(
    @Inject(REDIS_AUTH) private readonly redis: Redis,
    private readonly tokenService: TokenService,
  ) { }

  private assertExecOk(results: [Error | null, unknown][] | null, context: string) {
    if (!results) throw new Error(`${context}: transaction aborted`);
    const failed = results.find(([err]) => err);
    if (failed) throw failed[0];
  }

  private readonly logger = new Logger(PendingInvitationStore.name);
  async save(inviteTokenHash: string, data: PendingActivation) {
    const remaining = Math.floor((data.inviteTokenExpiresAt.getTime() - Date.now()) / 1000);
    const remainingTtl = Math.min(RedisTtl.activation, remaining)

    if (remainingTtl <= 0) return false;
    await this.redis.set(
      RedisKeys.activation(inviteTokenHash),
      JSON.stringify({ passwordHash: data.passwordHash, encryptedSecret: data.encryptedSecret, employeeId: data.employeeId }),
      "EX",
      remainingTtl // Which ever runs out first, the token's remaining time or the invite challenge (15 mins)
    )
    return true
  }
  async get(inviteTokenHash: string) {
    return await this.redis.get(RedisKeys.activation(inviteTokenHash))
  }
  async delete(inviteTokenHash: string) {
    return await this.redis.del(RedisKeys.activation(inviteTokenHash));
  }


}