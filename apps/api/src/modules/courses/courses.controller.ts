import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto, CreateCohortDto } from '@repo/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // --- Course Routes ---
  @Post()
  @Roles('ADMIN')
  createCourse(@Body() createDto: CreateCourseDto) {
    return this.coursesService.createCourse(createDto);
  }

  @Get()
  findAllCourses() {
    return this.coursesService.findAllCourses();
  }

  // --- Cohort Routes ---
  @Post('cohorts')
  @Roles('ADMIN')
  createCohort(@Body() createDto: CreateCohortDto) {
    return this.coursesService.createCohort(createDto);
  }

  @Get('cohorts')
  findCohorts(@Request() req) {
      if (req.user.role === 'TEACHER') {
          return this.coursesService.findCohorts({ teacherId: req.user.id });
      }
      // Admin sees all. Students might need a different view (e.g. only their enrollments)
      return this.coursesService.findCohorts({});
  }

  @Get('cohorts/:id')
  findOneCohort(@Request() req, @Param('id') id: string) {
      return this.coursesService.getCohort(id, req.user.id, req.user.role);
  }

  @Post('cohorts/:id/assign')
  @Roles('ADMIN')
  assignTeacher(
      @Param('id') cohortId: string, 
      @Body() body: { teacherId: string, isPrimary: boolean }
  ) {
      return this.coursesService.assignTeacher(cohortId, body.teacherId, body.isPrimary);
  }
}
