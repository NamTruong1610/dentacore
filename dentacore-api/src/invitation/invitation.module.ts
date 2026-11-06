import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service.js';
import { InvitationController } from './invitation.controller.js';
import { EmployeeModule } from '../employee/employee.module.js';
import { MailModule } from '../mail/mail.module.js';

@Module({
  imports: [EmployeeModule, MailModule],
  providers: [InvitationService],
  controllers: [InvitationController]
})
export class InvitationModule {}
