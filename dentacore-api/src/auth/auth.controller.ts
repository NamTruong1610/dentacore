import { Body, Controller, Headers, Ip, Post, Res } from '@nestjs/common';
import { LoginPasswordDto } from './dto/login-password.dto.js';
import { AuthService } from './auth.service.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { HttpAdapterHost } from '@nestjs/core';
import { SESSION_COOKIE } from './auth.constants.js';
import { Public } from './decorators/public.decorator.js';

@Controller('auth')
@Public()
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
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
    // passthrough:true here leaves response handling to framework.
    // Otherwise you would need to send response manually, like: `res.json({data})`
    @Res({ passthrough: true }) res: Response,
  ) {
    const { sessionIdRaw, rememberMe, absoluteExpiresAt } = await this.authService.verifyOtp(verifyOtpDto, ip, userAgent )
    this.adapterHost.httpAdapter.setCookie(res, SESSION_COOKIE, sessionIdRaw, {
      sameSite: 'strict',
      maxAge: rememberMe === true ? Math.floor((absoluteExpiresAt - Date.now()) / 1000) : undefined,
      secure: true,
      httpOnly: true,
    });
  }
}
