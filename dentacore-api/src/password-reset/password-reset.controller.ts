import { Body, Controller, Post } from '@nestjs/common';
import { PasswordResetRequestDto } from './dtos/password-reset-request.dto.js';
import { PasswordResetService } from './password-reset.service.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Controller('auth')
@Public()
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}
  @Post('password-reset/request')
    async requestPasswordReset(
      @Body() resetReqDto: PasswordResetRequestDto
    ) {
      await this.passwordResetService.requestPasswordReset(resetReqDto)
    }
}
