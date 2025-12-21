import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
// import { CreateMaterialDto } from '@repo/shared';
// Assuming DTO might not be in shared yet, defining interface locally or using any for MVP velocity if user didn't request DTO update.
// Actually, user objective is high level. I'll use inline types if DTO is missing to avoid package rebuilds, or check shared.

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, creatorId: string) {
      // Data: { cohortId, title, fileUrl, type, visibility }
      return this.prisma.material.create({
          data: {
              ...data,
              createdById: creatorId
          }
      });
  }

  async findAllByCohort(cohortId: string, actorRole: string) {
      // Filter visibility
      // If STUDENT -> Visibility.STUDENTS or BOTH
      // If TEACHER -> Visibility.TEACHERS or BOTH
      // ADMIN -> All (conceptually, or same as Teacher)
      
      const where: any = { cohortId };
      if (actorRole === 'STUDENT') {
          where.visibility = { in: ['STUDENTS', 'BOTH'] };
      }
      // Teachers usually see everything or specific teacher materials. 
      // Schema has Visibility Enum: STUDENTS, TEACHERS, BOTH.
      
      return this.prisma.material.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { fullName: true } } }
      });
  }

  async remove(id: string, actorRole: string) {
      if (actorRole === 'STUDENT') throw new ForbiddenException('Students cannot delete materials');
      return this.prisma.material.delete({ where: { id } });
  }
}
