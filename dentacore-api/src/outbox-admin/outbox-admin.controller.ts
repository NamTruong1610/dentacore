import { Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { OutboxDeadLetters } from '@nestjs/outbox';

@Controller('admin/outbox')
@UseGuards(/* your admin/auth guard */)
export class OutboxAdminController {
  constructor(private readonly outboxDeadLetters: OutboxDeadLetters) {}

  @Get('dead-letters')
  list(@Query('topic') topic?: string) {
    return this.outboxDeadLetters.list({ topic });
  }

  @Post('dead-letters/:id/requeue')
  @HttpCode(HttpStatus.OK)
  async requeue(@Param('id') id: string) {
    return { requeued: await this.outboxDeadLetters.requeue(id) };
  }
}