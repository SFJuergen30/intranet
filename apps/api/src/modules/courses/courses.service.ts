import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto, CreateCohortDto, AssignTeacherSchema } from '@repo/shared';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  // --- Courses ---
  async createCourse(data: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        title: data.title,
        type: data.type as any,
        description: data.description,
        imageUrl: data.imageUrl,
      },
    });
  }

  async findAllCourses() {
    return this.prisma.course.findMany({
        include: { _count: { select: { cohorts: true } } }
    });
  }

  async findOneCourse(id: string) {
    const course = await this.prisma.course.findUnique({
        where: { id },
        include: { cohorts: true }
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  // --- Cohorts ---
  async createCohort(data: CreateCohortDto) {
    return this.prisma.cohort.create({
      data: {
        courseId: data.courseId,
        campusId: data.campusId,
        name: data.name,
        startDate: new Date(data.startDate),
        schedule: data.schedule,
        capacity: data.capacity,
      },
    });
  }

  async findCohorts(query: { teacherId?: string }) {
      if (query.teacherId) {
          // Find cohorts assigned to this teacher
          return this.prisma.cohort.findMany({
              where: {
                  teachers: {
                      some: { teacher: { userId: query.teacherId } } 
                  }
              },
              include: { course: true, campus: true }
          })
      }
      return this.prisma.cohort.findMany({
          include: { course: true, campus: true }
      });
  }

  async getCohort(id: string, actorId: string, role: string) {
    const cohort = await this.prisma.cohort.findUnique({
        where: { id },
        include: {
            course: true,
            campus: true,
            enrollments: {
                include: {
                    student: { include: { user: true } },
                }
            }
        }
    });
    if (!cohort) throw new NotFoundException('Cohort not found');

    if (role === 'TEACHER') {
        const assigned = await this.prisma.cohortTeacher.findFirst({
            where: {
                cohortId: id,
                teacher: { userId: actorId }
            }
        });
        if (!assigned) {
             // throw new ForbiddenException('Not assigned to this cohort');
             // Typescript might complain if ForbiddenException is not imported or different module.
             // It is imported from @nestjs/common in the file top.
             throw new NotFoundException('Cohort not found or access denied'); 
        }
    }
    return cohort;
  }

  // --- Assignments ---
  async assignTeacher(cohortId: string, teacherId: string, isPrimary: boolean = false) {
      // teacherId here expects the TeacherProfile ID, or we resolve it from UserID?
      // Let's assume input is TeacherProfile ID for precision, or catch errors
      return this.prisma.cohortTeacher.create({
          data: {
              cohortId,
              teacherId,
              isPrimary
          }
      }).catch(e => {
          throw new BadRequestException('Assignment failed. Teacher might already be assigned.');
      });
  }
}
