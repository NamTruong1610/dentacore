import { Module } from '@nestjs/common';
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
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EmployeeModule, 
    InvitationModule, 
    PrismaModule, 
    CryptoModule,
    OutboxModule.forRoot({
      relay: { pollInterval: '1s' },
      retry: { attempts: 10, backoff: { delay: '1s', maxDelay: '1m' } },
    }),
    OutboxAdminModule,
    MailModule,
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
export class AppModule {}
