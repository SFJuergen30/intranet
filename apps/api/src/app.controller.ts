import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('debug')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('users')
  async getUsers() {
    // SECURITY WARNING: This is for debugging only. Remove in production.
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
      },
    });
    return {
      count: users.length,
      users,
      timestamp: new Date().toISOString(),
    };
  }
  
  @Get('ping')
  ping() {
    return "pong " + new Date().toISOString();
  }
}
