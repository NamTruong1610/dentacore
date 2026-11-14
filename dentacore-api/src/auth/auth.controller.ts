import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { LoginPasswordDto } from './dto/login-password.dto.js';
import { AuthService } from './auth.service.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { HttpAdapterHost } from '@nestjs/core';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly adapterHost: HttpAdapterHost
  ) { }
  @Post('login')
  async login(
    @Body() loginPasswordDto: LoginPasswordDto,
  ) {
    return await this.authService.login(loginPasswordDto)
  }

  @Post('verify')
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    // passthrough:true here leaves response handling to framework.
    // Otherwise you would need to send response manually, like: `res.json({data})`
    @Res({ passthrough: true }) res: Response,
  ) {
    const { sessionIdRaw, rememberMe } = await this.authService.verifyOtp(verifyOtpDto)
    this.adapterHost.httpAdapter.setCookie(res, '__Host-sid', sessionIdRaw, {
      sameSite: 'strict',
      maxAge: rememberMe === true ? 60 * 60 * 24 * 30 : undefined, 
      secure: true,
      httpOnly: true,
    });
  }
}
