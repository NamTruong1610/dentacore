import { Body, Controller, Post } from '@nestjs/common';
import { PasswordResetRequestDto } from './dtos/password-reset-request.dto.js';

@Controller('auth')
export class PasswordResetController {
  @Post('password-reset/request')
    async requestPasswordReset(
      @Body() resetReqDto: PasswordResetRequestDto
    ) {
      
    }
}
