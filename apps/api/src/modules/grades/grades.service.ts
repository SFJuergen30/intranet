import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGradeDto, UpdateGradeDto, RoleEnum } from '@repo/shared';

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  // Helper to get TeacherProfile ID
  private async getTeacherProfileId(userId: string) {
    const profile = await this.prisma.teacherProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('User is not a teacher');
    return profile.id;
  }

  async create(actorId: string, actorRole: string, data: CreateGradeDto) {
    // 1. Check Enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
        where: { id: data.enrollmentId },
        include: { cohort: true }
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    // 2. Access Control
    if (actorRole === 'TEACHER') {
        const teacherProfileId = await this.getTeacherProfileId(actorId);
        const assignment = await this.prisma.cohortTeacher.findUnique({
            where: {
                cohortId_teacherId: {
                    cohortId: enrollment.cohortId,
                    teacherId: teacherProfileId
                }
            }
        });
        if (!assignment) throw new ForbiddenException('You are not assigned to this cohort');
    }

    // 3. Check specific uniqueness manually if needed (Prisma will throw, but cleaner to check)
    // Prisma @@unique([enrollmentId, moduleName]) will handle it.

    // 4. Create Grade
    // Note: gradedByTeacherId refers to userID (User model) per schema.
    return this.prisma.grade.create({
        data: {
            enrollmentId: data.enrollmentId,
            moduleName: data.moduleName,
            score: data.score,
            feedback: data.feedback,
            gradedByTeacherId: actorId 
        }
    });
  }

  async update(id: string, actorId: string, actorRole: string, data: UpdateGradeDto) {
      const grade = await this.prisma.grade.findUnique({
          where: { id },
          include: { enrollment: true }
      });
      if (!grade) throw new NotFoundException('Grade not found');

      if (actorRole === 'TEACHER') {
          const teacherProfileId = await this.getTeacherProfileId(actorId);
          // Check if teacher is assigned to the cohort of the enrollment
          const assignment = await this.prisma.cohortTeacher.findUnique({
            where: {
                cohortId_teacherId: {
                    cohortId: grade.enrollment.cohortId,
                    teacherId: teacherProfileId
                }
            }
          });
          
          // Optional: Check if editing own grade? User said "belong to assigned cohort" is the rule.
          // "(opcional) gradedByTeacherId == teacherId" -> letting generic assignment rule prevail for now.
          
          if (!assignment) throw new ForbiddenException('You are not assigned to this cohort');
      }

      return this.prisma.grade.update({
          where: { id },
          data: {
              score: data.score,
              feedback: data.feedback
          }
      });
  }

  async findByEnrollment(enrollmentId: string, actorId: string, actorRole: string) {
      const enrollment = await this.prisma.enrollment.findUnique({
          where: { id: enrollmentId }
      });
      if (!enrollment) throw new NotFoundException('Enrollment not found');

      // RBAC
      if (actorRole === 'STUDENT') {
          const studentProfile = await this.prisma.studentProfile.findUnique({ where: { userId: actorId } });
          if (!studentProfile || studentProfile.id !== enrollment.studentId) {
              throw new ForbiddenException('Cannot view grades of another student');
          }
      } else if (actorRole === 'TEACHER') {
          const teacherProfileId = await this.getTeacherProfileId(actorId);
          const assignment = await this.prisma.cohortTeacher.findUnique({
              where: {
                  cohortId_teacherId: {
                      cohortId: enrollment.cohortId,
                      teacherId: teacherProfileId
                  }
              }
          });
          if (!assignment) throw new ForbiddenException('Not assigned to this cohort');
      }

      return this.prisma.grade.findMany({
          where: { enrollmentId },
          orderBy: { createdAt: 'desc' }
      });
  }

  async getCohortSummary(cohortId: string, actorId: string, actorRole: string) {
      // 1. Check Access
      if (actorRole === 'TEACHER') {
          const teacherProfileId = await this.getTeacherProfileId(actorId);
          const assignment = await this.prisma.cohortTeacher.findUnique({
             where: { cohortId_teacherId: { cohortId, teacherId: teacherProfileId } }
          });
          if (!assignment) throw new ForbiddenException('Not assigned to this cohort');
      } else if (actorRole === 'STUDENT') {
           throw new ForbiddenException('Students cannot view cohort summary');
      }
      
      // 2. Aggregate
      // We want average score per module
      const grades = await this.prisma.grade.findMany({
          where: { enrollment: { cohortId } },
          select: { moduleName: true, score: true }
      });

      const summary = {};
      const counts = {};

      grades.forEach(g => {
          if (!summary[g.moduleName]) {
              summary[g.moduleName] = 0;
              counts[g.moduleName] = 0;
          }
          summary[g.moduleName] += g.score;
          counts[g.moduleName]++;
      });

      return Object.keys(summary).map(module => ({
          moduleName: module,
          average: Number((summary[module] / counts[module]).toFixed(2)),
          count: counts[module]
      }));
  }
}
