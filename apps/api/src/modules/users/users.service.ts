import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, UpdateUserSchema, RoleEnum } from '@repo/shared';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new BadRequestException('Email already in use');

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Transaction to create user + profile if needed
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          fullName: data.fullName,
          role: data.role as any, // Cast to Prisma enum if needed or ensure safe types
        },
      });

      // Create empty profile based on role
      if (data.role === 'TEACHER') {
        await tx.teacherProfile.create({ data: { userId: user.id } });
      } else if (data.role === 'STUDENT') {
        await tx.studentProfile.create({ 
          data: { 
            userId: user.id,
            scheduleUrl: data.scheduleUrl || null,
            paymentScheduleUrl: data.paymentScheduleUrl || null,
            resourceLinks: data.resourceLinks ? (data.resourceLinks as any) : undefined
          } 
        });
      }
      
      // Log creation
      await tx.auditLog.create({
          data: {
              actorUserId: user.id, // Self-registration or Admin ID if passed
              action: 'CREATE',
              entity: 'User',
              entityId: user.id,
              meta: { role: data.role }
          }
      })

      const { passwordHash: p, ...result } = user;
      return result;
    });
  }

  async findAll(params?: { role?: string }) {
    const where = params?.role ? { role: params.role as any } : undefined;
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });
  }

  async findOne(id: string, actorId?: string, actorRole?: string) {
      if (actorId && actorRole !== 'ADMIN' && actorId !== id) {
          throw new ForbiddenException('You can only view your own profile');
      }

      const user = await this.prisma.user.findUnique({
          where: { id },
          include: {
              studentProfile: true,
              teacherProfile: true
          }
      });
      if (!user) throw new NotFoundException('User not found');
      const { passwordHash, ...result } = user;
      return result;
  }
  
  async update(id: string, data: Partial<RegisterDto>) { // Simplified type
      // Implementation of update logic
      // Note: Updating sensitive fields like password requires simplified handling
      return this.prisma.user.update({
          where: { id },
          data: {
            fullName: data.fullName,
            // ... potentially other fields
          }
      })
  }
  async remove(id: string) {
      // Prisma usually handles cascading if configured, but we can rely on foreign key constraints
      // to error if not. 
      return this.prisma.user.delete({
          where: { id }
      });
  }
}
