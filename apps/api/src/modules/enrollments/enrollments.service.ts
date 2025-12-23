import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEnrollmentDto } from '@repo/shared';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
      return this.prisma.enrollment.findMany({
          include: {
              student: { include: { user: true } },
              cohort: { include: { course: true, campus: true } }
          },
          orderBy: { enrolledAt: 'desc' }
      });
  }

  async create(data: CreateEnrollmentDto) {
    // Check occupancy
    const cohort = await this.prisma.cohort.findUnique({
        where: { id: data.cohortId },
        include: { _count: { select: { enrollments: true } } }
    });
    if (!cohort) throw new NotFoundException('Cohort not found');
    
    if (cohort._count.enrollments >= cohort.capacity) {
        throw new BadRequestException('Cohort is full');
    }

    const enrollment = await this.prisma.enrollment.create({
        data: {
            studentId: data.studentId,
            cohortId: data.cohortId,
            status: 'ACTIVE'
        }
    });
    return enrollment;
  }

  async findByStudent(userId: string) {
      return this.prisma.enrollment.findMany({
          where: { student: { userId } },
          include: { 
              cohort: {
                  include: { course: true, campus: true }
              } 
          }
      });
  }

  async findByCohort(cohortId: string) {
      return this.prisma.enrollment.findMany({
          where: { cohortId },
          include: {
              student: {
                  include: { user: { select: { fullName: true, email: true } } }
              }
          }
      })
  }

  async getStudentProgress(enrollmentId: string, actorId: string, actorRole: string) {
      const enrollment = await this.prisma.enrollment.findUnique({
          where: { id: enrollmentId },
          include: {
              attendance: true,
              grades: true,
              cohort: { include: { teachers: { include: { teacher: true } } } } // For Teacher check
          }
      });
      if (!enrollment) throw new NotFoundException('Enrollment not found');

      // RBAC
      if (actorRole === 'STUDENT') {
          // Check ownership
          const studentProfile = await this.prisma.studentProfile.findUnique({ where: { userId: actorId } });
          if (!studentProfile || studentProfile.id !== enrollment.studentId) {
              throw new ForbiddenException('Cannot view progress of another student');
          }
      } else if (actorRole === 'TEACHER') {
          // Check assignment
          const isAssigned = enrollment.cohort.teachers.some(t => t.teacher.userId === actorId);
          if (!isAssigned) throw new ForbiddenException('Not assigned to this student\'s cohort');
      }

      // Attendance
      const totalDays = enrollment.attendance.length;
      const presentDays = enrollment.attendance.filter(a => a.isPresent).length;
      const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      // Grades
      const totalGrades = enrollment.grades.length;
      const sumGrades = enrollment.grades.reduce((acc, curr) => acc + curr.score, 0);
      const averageGrade = totalGrades > 0 ? (sumGrades / totalGrades) : 0;

      return {
          enrollmentId,
          attendancePercentage: Number(attendancePercentage.toFixed(2)),
          averageGrade: Number(averageGrade.toFixed(2)),
          details: {
              totalClasses: totalDays,
              presentClasses: presentDays,
              modulesGraded: totalGrades
          }
      };
  }
}
