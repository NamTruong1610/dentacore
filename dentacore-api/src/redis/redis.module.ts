import { Global, Inject, Logger, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { REDIS_SESSION } from './redis.constants.js';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_SESSION,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const logger = new Logger('RedisSession');

        const client = new Redis(config.getOrThrow<string>('REDIS_SESSION_URL'), {
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
  ],
  exports: [REDIS_SESSION],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_SESSION) private readonly client: Redis) {}

  // quit() lets in-flight commands finish; disconnect() would drop them.
  // Runs on SIGTERM only if main.ts calls app.enableShutdownHooks().
  async onApplicationShutdown(): Promise<void> {
    await this.client.quit();
  }
}