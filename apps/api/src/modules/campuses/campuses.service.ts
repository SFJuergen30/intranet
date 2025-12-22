import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CampusesService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; address?: string }) {
    return this.prisma.campus.create({ data });
  }

  async findAll() {
    return this.prisma.campus.findMany();
  }

  async findOne(id: string) {
    return this.prisma.campus.findUnique({ where: { id } });
  }

  async update(id: string, data: { name?: string; address?: string }) {
    return this.prisma.campus.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.campus.delete({ where: { id } });
  }
}
