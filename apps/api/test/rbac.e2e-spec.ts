import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('RBAC & Security (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  let teacherToken: string;
  let student1Token: string;
  let student2Token: string;
  let adminToken: string;
  
  let student1Id: string;
  let student2Id: string;
  let student1EnrollmentId: string;
  let student2EnrollmentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);

    // 1. Get Users
    const s1 = await prisma.user.findUnique({ 
        where: { email: 'student1@blackwhiteacademy.com' },
        include: { studentProfile: true }
    });
    student1Id = s1.id;
    
    // Find a second student dynamically
    const s2 = await prisma.user.findFirst({ 
        where: { 
            role: 'STUDENT',
            NOT: { email: 'student1@blackwhiteacademy.com' }
        },
        include: { studentProfile: true }
    });
    if (!s2) throw new Error('Need at least 2 students for RBAC testing');
    student2Id = s2.id;

    // 2. Get Enrollments (for grades test)
    const e1 = await prisma.enrollment.findFirst({ where: { studentId: s1.studentProfile?.id } });
    // Assuming enrollment exists for student 1. If not, create?
    if (!e1) throw new Error('Student 1 needs an enrollment');
    student1EnrollmentId = e1.id;

    const e2 = await prisma.enrollment.findFirst({ where: { studentId: s2.studentProfile?.id } });
    if (!e2) throw new Error('Student 2 needs an enrollment');
    student2EnrollmentId = e2.id;

    // 3. Login
    const tRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'teacher1@blackwhiteacademy.com', password: 'Teacher123!' });
    teacherToken = tRes.body.accessToken;

    const s1Res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'student1@blackwhiteacademy.com', password: 'Student123!' });
    student1Token = s1Res.body.accessToken;

    // We can't login as Student 2 easily if we don't know password.
    // Assuming seed password pattern 'Student123!' or we generated it. 
    // Actually, we don't need S2 token to test S1 accessing S2's data.
    // We only need S1 token.

    const aRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@blackwhiteacademy.com', password: 'Admin123!' });
    adminToken = aRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Management /users', () => {
      it('Admin should be able to create a user', async () => {
          const email = `testuser_${Date.now()}@test.com`;
          return request(app.getHttpServer())
            .post('/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                email,
                password: 'Password123!',
                fullName: 'Test User',
                role: 'STUDENT'
            })
            .expect(201);
      });

      it('Teacher should NOT be able to create a user (403)', () => {
          return request(app.getHttpServer())
            .post('/users')
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({
                email: 'hacker@test.com',
                password: 'Password123!',
                fullName: 'Hacker',
                role: 'ADMIN'
            })
            .expect(403);
      });

      it('Student should NOT be able to create a user (403)', () => {
        return request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${student1Token}`)
          .send({
              email: 'hacker2@test.com',
              password: 'Password123!',
              fullName: 'Hacker',
              role: 'ADMIN'
          })
          .expect(403);
    });

    it('Public should NOT be able to create a user (401)', () => {
        return request(app.getHttpServer())
          .post('/users')
          .send({
              email: 'hacker3@test.com',
              password: 'Password123!',
              fullName: 'Hacker',
              role: 'ADMIN'
          })
          .expect(401);
    });
  });

  describe('User Profile Access /users/:id', () => {
      it('Admin can view Student1 profile', () => {
          return request(app.getHttpServer())
            .get(`/users/${student1Id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
      });

      it('Student1 can view own profile', () => {
        return request(app.getHttpServer())
          .get(`/users/${student1Id}`)
          .set('Authorization', `Bearer ${student1Token}`)
          .expect(200);
      });

      it('Student1 can NOT view Student2 profile (403)', () => {
        return request(app.getHttpServer())
          .get(`/users/${student2Id}`)
          .set('Authorization', `Bearer ${student1Token}`)
          .expect(403);
    });
  });

  describe('Data Privacy (Grades)', () => {
    it('Student1 should NOT see grades of Student2', () => {
        return request(app.getHttpServer())
            .get(`/grades/enrollment/${student2EnrollmentId}`)
            .set('Authorization', `Bearer ${student1Token}`)
            .expect(403);
    });
  });
});
