import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisKeys, RedisTtl } from './auth-redis.keys.js';
import { TokenService } from '../../common/crypto/token.service.js';
import { REDIS_AUTH } from '../../redis/redis.constants.js';
import { Redis } from 'ioredis';
import { RedisUtils } from '../../redis/redis.utils.js';


@Injectable()
export class SessionStore {
  constructor(
    @Inject(REDIS_AUTH) private readonly redis: Redis,
    private readonly tokenService: TokenService,
    private readonly redisUtils: RedisUtils
  ) { }


  private readonly logger = new Logger(SessionStore.name);

  private async undoCreate(employeeId: string, sessionIdHash: string) {
    try {
      await this.redis.multi()
        .del(RedisKeys.session(sessionIdHash))
        .srem(RedisKeys.userSessions(employeeId), sessionIdHash)
        .exec();
    } catch (cleanupErr) {
      this.logger.error(`Failed to undo session create for ${employeeId}: ${cleanupErr}`);
    }
  }

  async create(employeeId: string, rememberMe: boolean, ip: string, userAgent: string | undefined) {

    const sessionIdRaw = this.tokenService.generate()
    const sessionIdHash = this.tokenService.digest(sessionIdRaw)

    // Create new session

    let absoluteExpiresAt: number = Date.now() + RedisTtl.sessionAbsolute * 1000
    let sessionIdle: number = RedisTtl.sessionIdle
    let sessionAbsolute: number = RedisTtl.sessionAbsolute

    if (rememberMe) {
      absoluteExpiresAt = Date.now() + RedisTtl.sessionRememberMeAbsolute * 1000
      sessionIdle = RedisTtl.sessionIdleRememberMe
      sessionAbsolute = RedisTtl.sessionRememberMeAbsolute
    }

    try {
      const results = await this.redis.multi()
        .set(RedisKeys.session(sessionIdHash), JSON.stringify({
          id: employeeId,
          userAgent: userAgent?.slice(0, 256) ?? '',
          ip,
          absoluteExpiresAt,
          rememberMe
        }), 'EX', sessionIdle)
        .sadd(RedisKeys.userSessions(employeeId), sessionIdHash)
        .expire(RedisKeys.userSessions(employeeId), sessionAbsolute, 'NX')
        .expire(RedisKeys.userSessions(employeeId), sessionAbsolute, 'GT')
        .exec();
      this.redisUtils.assertExecOk(results, 'session create');
    } catch (err) {
      await this.undoCreate(employeeId, sessionIdHash);
      throw err;
    }

    // Prune expired sessions
    try {
      await this.pruneExpired(employeeId)
    } catch  {
      this.logger.error(`Failed to prune expired sessions`);
    }

    return { sessionIdRaw, absoluteExpiresAt }
  }

  async validateAndSlide(sessionIdHash: string) {
    const rawPayload = await this.redis.get(RedisKeys.session(sessionIdHash))

    if (!rawPayload) {
      return null
    }

    const parsedPayload = JSON.parse(rawPayload)

    // Slide or delete expired session
    const timeRemainingMs = parsedPayload.absoluteExpiresAt - Date.now()

    const sessionIdle = parsedPayload.rememberMe === true ? RedisTtl.sessionIdleRememberMe : RedisTtl.sessionIdle
    const timeRemainingSeconds = Math.floor(Math.min(timeRemainingMs, sessionIdle * 1000) / 1000)

    if (timeRemainingSeconds <= 0) {
      try {
        await this.revoke(parsedPayload.id, sessionIdHash)
      } catch(error) {
        this.logger.error(`Failed to revoke session ${sessionIdHash}`, error instanceof Error ? error.stack : String(error))
      }
      
      return null
    }

    await this.redis.expire(RedisKeys.session(sessionIdHash), timeRemainingSeconds)
    return { id: parsedPayload.id }

  }

  async revoke(employeeId: string, sessionIdHash: string) {
    const results = await this.redis
      .multi()
      .del(RedisKeys.session(sessionIdHash))
      .srem(RedisKeys.userSessions(employeeId), sessionIdHash)
      .exec()
    this.redisUtils.assertExecOk(results, 'session revoked');
  }

  async revokeAll(employeeId: string) {
    const sessionIdHashes = await this.redis.smembers(RedisKeys.userSessions(employeeId))
    const sessionsPrunePipeline = this.redis.pipeline()
    for (const sid of sessionIdHashes) {
      sessionsPrunePipeline.del(RedisKeys.session(sid))
    }
    sessionsPrunePipeline.del(RedisKeys.userSessions(employeeId))
    await sessionsPrunePipeline.exec()
  }

  async pruneExpired(employeeId: string) {
    const hashes = await this.redis.smembers(RedisKeys.userSessions(employeeId))
    if (hashes.length === 0) return
    const sessionExistsPipeline = this.redis.pipeline()
    for (const sessionIdHash of hashes) {
      sessionExistsPipeline.exists(RedisKeys.session(sessionIdHash))
    }

    const results = await sessionExistsPipeline.exec()
    if (!results) return
    const expiredSessionHashes: string[] = []

    for (let i = 0; i < hashes.length; i++) {
      if (!results[i][1] && !results[i][0]) {
        expiredSessionHashes.push(hashes[i])
      }
    }

    if (expiredSessionHashes.length > 0) {
      await this.redis.srem(RedisKeys.userSessions(employeeId), expiredSessionHashes);
    }
  }
}

