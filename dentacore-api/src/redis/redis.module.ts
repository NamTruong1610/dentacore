import { Global, Inject, Logger, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { REDIS_AUTH, REDIS_CACHE } from './redis.constants.js';
import { RedisUtils } from './redis.utils.js';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_AUTH, 
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const logger = new Logger('RedisSession');

        const client = new Redis(config.getOrThrow<string>('REDIS_AUTH_URL'), {
          // Batches concurrent commands from many requests into one round trip.
          enableAutoPipelining: true,
          // Fail a command after 3 reconnect attempts instead of hanging the request.
          maxRetriesPerRequest: 3,
        });

        // Log only. ioredis reconnects on its own; throwing here would crash the process.
        client.on('error', (err) => logger.error(`Session Redis error: ${err.message}`));
        client.on('ready', () => logger.log('Connected to session Redis'));

        return client;
      },
    },
    {
      provide: REDIS_CACHE, 
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const logger = new Logger('RedisSession');

        const client = new Redis(config.getOrThrow<string>('REDIS_CACHE_URL'), {
          // Batches concurrent commands from many requests into one round trip.
          enableAutoPipelining: true,
          // Fail a command after 3 reconnect attempts instead of hanging the request.
          maxRetriesPerRequest: 3,
        });

        // Log only. ioredis reconnects on its own; throwing here would crash the process.
        client.on('error', (err) => logger.error(`Session Redis error: ${err.message}`));
        client.on('ready', () => logger.log('Connected to session Redis'));

        return client;
      },
    },
    RedisUtils
  ],
  exports: [REDIS_AUTH, REDIS_CACHE, RedisUtils],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(
    @Inject(REDIS_AUTH) private readonly authClient: Redis,
    @Inject(REDIS_CACHE) private readonly cacheClient: Redis
  ) {}

  // quit() lets in-flight commands finish; disconnect() would drop them.
  // Runs on SIGTERM only if main.ts calls app.enableShutdownHooks().
  async onApplicationShutdown(): Promise<void> {
    await this.authClient.quit();
    await this.cacheClient.quit();
  }
}