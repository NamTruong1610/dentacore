import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { REDIS_AUTH } from '../../redis/redis.constants.js';
import { Redis } from 'ioredis';


interface PendingActivation {
  passwordHash: string,
  encryptedSecret: string,
  employeeId: string
}

const activationKey = (inviteTokenHash: string) => `invitation:activation:${inviteTokenHash}`;
const ACTIVATION_TTL_SECONDS = 15 * 60;

@Injectable()
export class PendingInvitationStore {
  constructor(
    @Inject(REDIS_AUTH) private readonly redis: Redis,
  ) { }

  async save(inviteTokenHash: string, data: PendingActivation, tokenExpiresAt: Date) {
    const remaining = Math.floor((tokenExpiresAt.getTime() - Date.now()) / 1000);
    const remainingTtl = Math.min(ACTIVATION_TTL_SECONDS, remaining)

    if (remainingTtl <= 0) return false;
    await this.redis.set(
      activationKey(inviteTokenHash),
      JSON.stringify({ passwordHash: data.passwordHash, encryptedSecret: data.encryptedSecret, employeeId: data.employeeId }),
      "EX",
      remainingTtl // Which ever runs out first, the token's remaining time or the invite challenge (15 mins)
    )
    return true
  }
  async get(inviteTokenHash: string) {
    const rawPayload = await this.redis.get(activationKey(inviteTokenHash))
    if (!rawPayload) return null
    else return JSON.parse(rawPayload)
  }
  async delete(inviteTokenHash: string) {
    return await this.redis.del(activationKey(inviteTokenHash));
  }


}