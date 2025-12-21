import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from '@repo/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('batch')
  @Roles('TEACHER', 'ADMIN')
  markBatch(@Request() req, @Body() dto: MarkAttendanceDto) {
      return this.attendanceService.markBatch(dto, req.user.id);
  }

  @Get('enrollment/:enrollmentId')
  @Roles('TEACHER', 'ADMIN', 'STUDENT')
  findByEnrollment(@Param('enrollmentId') enrollmentId: string) {
      // TODO: Add Student ownership check (can only see own)
      return this.attendanceService.findByEnrollment(enrollmentId);
  }

  @Get('cohort/:cohortId')
  @Roles('TEACHER', 'ADMIN')
  findByCohort(@Request() req, @Param('cohortId') cohortId: string, @Query('date') date?: string) {
      // TODO: Verify Teacher assignment to this cohort
      const d = date ? new Date(date) : undefined;
      return this.attendanceService.findByCohort(cohortId, d);
  }
}
