import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { GradesModule } from './modules/grades/grades.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { CampusesModule } from './modules/campuses/campuses.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    EnrollmentsModule,
    AttendanceModule,
    GradesModule,
    CertificatesModule,
    CertificatesModule,
    MaterialsModule,
    CampusesModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
