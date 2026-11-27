import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { REDIS_CACHE } from '../../redis/redis.constants.js';
import { Redis } from 'ioredis';
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
    const permissionSet = new Set<string>(parsedPayload);
    return permissionSet
  }

  async create(employeeId: string, permissionList: string[]) {
    await this.redis.set(RedisKeys.permissions(employeeId), JSON.stringify(permissionList), 'EX', RedisTtl.rbacTtl)
  }

}

