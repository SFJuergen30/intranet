import { Controller, Get, Post, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from '@repo/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CohortAccessGuard } from '../../common/guards/cohort-access.guard'; // Assume global or import if specific

@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createDto);
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
      return this.enrollmentsService.findAll();
  }

  @Get('my-enrollments')
  @Roles('STUDENT')
  findMyEnrollments(@Request() req) {
      return this.enrollmentsService.findByStudent(req.user.id);
  }

  @Get('cohort/:cohortId')
  @UseGuards(CohortAccessGuard) // Teachers must be assigned, Admin ok
  @Roles('ADMIN', 'TEACHER')
  findByCohort(@Param('cohortId') cohortId: string) {
      return this.enrollmentsService.findByCohort(cohortId);
  }

  @Get(':id/progress')
  @Roles('STUDENT', 'TEACHER', 'ADMIN')
  getProgress(@Request() req, @Param('id') id: string) {
      return this.enrollmentsService.getStudentProgress(id, req.user.id, req.user.role);
  }
}
