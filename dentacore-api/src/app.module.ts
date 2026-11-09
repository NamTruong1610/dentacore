import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { EmployeeModule } from './employee/employee.module.js';
import { InvitationModule } from './invitation/invitation.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import { CryptoModule } from './common/crypto/crypto.module.js';
import { OutboxModule, OutboxStorage } from '@nestjs/outbox';
import { fromPrisma, PostgresOutboxStore } from '@nestjs/outbox/postgres';
import { OutboxAdminModule } from './outbox-admin/outbox-admin.module.js';
import { MailModule } from './mail/mail.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { ApiKeyMiddleware } from './common/middleware/api-key.middleware.js';
import { AuthModule } from './auth/auth.module.js';
import { RedisModule } from './redis/redis.module.js';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { validateEnv } from './config/env.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv  }),
    EmployeeModule,
    InvitationModule,
    PrismaModule,
    CryptoModule,
    OutboxModule.forRoot({
      relay: { pollInterval: '1s' },
      retry: { attempts: 10, backoff: { delay: '1s', maxDelay: '1m' } },
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
      plugins: [
        new ClsPluginTransactional({
          imports: [PrismaModule],
          adapter: new TransactionalAdapterPrisma({ prismaInjectionToken: PrismaService }),
        }),
      ],
    }),
    OutboxAdminModule,
    MailModule,
    AuthModule,
    RedisModule,
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        stores: [createKeyv(config.getOrThrow<string>('REDIS_CACHE_URL'))],
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: PostgresOutboxStore,
      inject: [PrismaService, OutboxStorage],
      useFactory: (prisma: PrismaService, storage: OutboxStorage) =>
        new PostgresOutboxStore({ executor: fromPrisma(prisma) }, storage),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // '*splat' applies middleware on all routes
    consumer.apply(ApiKeyMiddleware).forRoutes('*splat')
  }
}
