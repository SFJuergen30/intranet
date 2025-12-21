import { Controller, Post, UseGuards, Request, Res, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.authService.login(user);

    // Set Refresh Token in HttpOnly Cookie
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // or 'strict'
      path: '/auth/refresh', // only sent to refresh endpoint
    });

    return { 
        accessToken: tokens.accessToken,
        user: tokens.user
    };
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  async refresh(@Request() req) {
      // Req.user is populated by JwtRefreshStrategy
      return this.authService.refresh(req.user);
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
      res.clearCookie('refresh_token', { path: '/auth/refresh' });
      return { message: 'Logged out' };
  }
}
