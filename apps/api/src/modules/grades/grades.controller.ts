import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { GradesService } from './grades.service';
import { CreateGradeDto, UpdateGradeDto } from '@repo/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @Roles('TEACHER', 'ADMIN')
  create(@Request() req, @Body() dto: CreateGradeDto) {
    return this.gradesService.create(req.user.id, req.user.role, dto);
  }

  @Put(':id')
  @Roles('TEACHER', 'ADMIN')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateGradeDto) {
    return this.gradesService.update(id, req.user.id, req.user.role, dto);
  }

  @Get('enrollment/:enrollmentId')
  // All roles can call this, but service restricts access logic
  findAllByEnrollment(@Request() req, @Param('enrollmentId') enrollmentId: string) {
    return this.gradesService.findByEnrollment(enrollmentId, req.user.id, req.user.role);
  }

  @Get('cohort/:cohortId/summary')
  @Roles('TEACHER', 'ADMIN')
  getCohortSummary(@Request() req, @Param('cohortId') cohortId: string) {
      return this.gradesService.getCohortSummary(cohortId, req.user.id, req.user.role);
  }
}
