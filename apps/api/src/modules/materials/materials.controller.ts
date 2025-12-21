import { Controller, Get, Post, Body, Param, UseGuards, Request, Delete, ForbiddenException } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('materials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @Roles('TEACHER', 'ADMIN')
  create(@Request() req, @Body() body: any) {
      // Body should have: cohortId, title, fileUrl, type, visibility
      return this.materialsService.create(body, req.user.id);
  }

  @Get('cohort/:cohortId')
  @Roles('STUDENT', 'TEACHER', 'ADMIN')
  findAllByCohort(@Request() req, @Param('cohortId') cohortId: string) {
      // TODO: Verify student enrollment or teacher assignment
      return this.materialsService.findAllByCohort(cohortId, req.user.role);
  }

  @Delete(':id')
  @Roles('TEACHER', 'ADMIN')
  remove(@Request() req, @Param('id') id: string) {
      return this.materialsService.remove(id, req.user.role);
  }
}
