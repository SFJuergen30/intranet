import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CohortAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Assumes cohortId is in params or body
    const cohortId = request.params.id || request.body.cohortId || request.query.cohortId;

    if (!user) throw new ForbiddenException('User not authenticated');
    if (!cohortId) return true; // Guard checks access IF cohort involved, skip if global? Or deny?
    // If this guard is applied, cohort access is expected.
    
    // ADMIN bypass
    if (user.role === 'ADMIN') return true;

    if (user.role === 'TEACHER') {
        // Check if teacher is assigned to this cohort
        // We need user.profileId or query by userId
        const assignment = await this.prisma.cohortTeacher.findFirst({
            where: {
                cohortId: cohortId,
                teacher: {
                    userId: user.id
                }
            }
        });
        if (!assignment) throw new ForbiddenException('You are not assigned to this cohort');
        return true;
    }

    if (user.role === 'STUDENT') {
        const enrollment = await this.prisma.enrollment.findFirst({
            where: {
                cohortId: cohortId,
                student: {
                    userId: user.id
                },
                status: 'ACTIVE' // Optional: only active students
            }
        });
        if (!enrollment) throw new ForbiddenException('You are not enrolled in this cohort');
        return true;
    }

    return false;
  }
}
