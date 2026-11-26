import { BadRequestException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { TokenService } from '../../common/crypto/token.service.js';
import { REDIS_AUTH, REDIS_CACHE } from '../../redis/redis.constants.js';
import { Redis } from 'ioredis';
import { RedisUtils } from '../../redis/redis.utils.js';
import { RedisKeys, RedisTtl } from './permission-redis.keys.js';


@Injectable()
export class PermissionCacheStore {
  constructor(
    @Inject(REDIS_CACHE) private readonly redis: Redis,
  ) { }



  async get(employeeId: string) {
    const rawPayload = await this.redis.get(RedisKeys.permissions(employeeId))
    if (!rawPayload) {
      return null
    }
    const parsedPayload = JSON.parse(rawPayload)
    const permissionSet = new Set<string>();
    for (const { action, target } of parsedPayload) {
      permissionSet.add(`${action}:${target}`)
    }
    return permissionSet
  }

  async create(employeeId: string, permissionList: string[]) {
    await this.redis.set(RedisKeys.permissions(employeeId), JSON.stringify(permissionList), 'EX', RedisTtl.rbacTtl)
  }

}

