import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IssueCertificateDto } from '@repo/shared';

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  async issue(adminId: string, data: IssueCertificateDto) {
    const enrollment = await this.prisma.enrollment.findUnique({
        where: { id: data.enrollmentId }
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    // Check if duplicate?
    const existing = await this.prisma.certificate.findFirst({
        where: { enrollmentId: data.enrollmentId, status: 'ISSUED' }
    });
    if (existing) throw new BadRequestException('Certificate already issued for this enrollment');

    // Generate Certificate Number (Simple Timestamp + Random for MVP)
    const certificateNumber = `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return this.prisma.certificate.create({
        data: {
            enrollmentId: data.enrollmentId,
            issuedByAdminId: adminId,
            certificateNumber,
            status: 'ISSUED', // Enum? We'll let Prisma/TS handle string literal if enum is generated
            certificateUrl: 'https://placeholder.com/certificate.pdf' // Placeholder
        }
    });
  }

  async revoke(id: string, adminId: string) {
      const cert = await this.prisma.certificate.findUnique({ where: { id } });
      if (!cert) throw new NotFoundException('Certificate not found');

      return this.prisma.certificate.update({
          where: { id },
          data: { status: 'REVOKED' }
      });
  }

  async findByEnrollment(enrollmentId: string, actorId: string, actorRole: string) {
    // RBAC
    if (actorRole === 'STUDENT') {
         const enrollment = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
         if (!enrollment) throw new NotFoundException('Enrollment not found');
         
         const studentProfile = await this.prisma.studentProfile.findUnique({ where: { userId: actorId } });
         if (!studentProfile || studentProfile.id !== enrollment.studentId) {
             throw new ForbiddenException('Cannot view certificate of another');
         }
    } else if (actorRole === 'TEACHER') {
        const enrollment = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
        if (!enrollment) throw new NotFoundException('Enrollment not found');
        
        // Check assignment
        const teacherProfile = await this.prisma.teacherProfile.findUnique({ where: { userId: actorId } });
        if(!teacherProfile) throw new ForbiddenException();

        const assignment = await this.prisma.cohortTeacher.findUnique({
            where: {
                cohortId_teacherId: {
                    cohortId: enrollment.cohortId,
                    teacherId: teacherProfile.id
                }
            }
        });
        if (!assignment) throw new ForbiddenException('Not assigned to this cohort');
    }

    return this.prisma.certificate.findFirst({
        where: { enrollmentId }
    });
  }
}
