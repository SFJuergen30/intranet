import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload, { 
      secret: this.config.get('JWT_SECRET') || 'secret',
      expiresIn: '15m' 
    });
    const refreshToken = this.jwtService.sign(payload, { 
      secret: this.config.get('JWT_REFRESH_SECRET') || 'refresh-secret', 
      expiresIn: '7d' 
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async refresh(user: any) {
    const payload = { email: user.email, sub: user.sub, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
        secret: this.config.get('JWT_SECRET') || 'secret',
        expiresIn: '15m'
    });
    return { accessToken };
  }
}
