import { Body, Controller, Post } from '@nestjs/common';
import { InviteEmployeeDto } from './dto/invite-employee.dto.js';
import { InvitationService } from './invitation.service.js';

@Controller('invitation')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}
  @Post()
  inviteNewEmployee(@Body inviteEmployeeDto: InviteEmployeeDto) {
    
  }
}
