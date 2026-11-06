import { Module } from '@nestjs/common';
import { OutboxAdminController } from './outbox-admin.controller.js';

@Module({
  controllers: [OutboxAdminController]
})
export class OutboxAdminModule {}
