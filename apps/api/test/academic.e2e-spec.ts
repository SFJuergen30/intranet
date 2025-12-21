import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module'; // Adjust import path
import { PrismaService } from '../src/prisma/prisma.service';

describe('Academic Module (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  let teacherToken: string;
  let studentToken: string;
  let adminToken: string;
  
  let enrollment1Id: string; // Barber Pro (assigned to Teacher 1)
  let enrollment3Id: string; // Unas Pro (NOT assigned to Teacher 1)

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);

    // Get Enrollments
    const e1 = await prisma.enrollment.findFirst({
        where: { student: { user: { email: 'student1@blackwhiteacademy.com' } } }
    });
    enrollment1Id = e1.id;

    const e3 = await prisma.enrollment.findFirst({
        where: { student: { user: { email: 'student3@blackwhiteacademy.com' } } }
    });
    enrollment3Id = e3.id;

    // Login Teacher 1
    const tRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'teacher1@blackwhiteacademy.com', password: 'Teacher123!' });
    teacherToken = tRes.body.accessToken;

    // Login Student 1
    const sRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'student1@blackwhiteacademy.com', password: 'Student123!' });
    studentToken = sRes.body.accessToken;

    // Login Admin
    const aRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@blackwhiteacademy.com', password: 'Admin123!' });
    adminToken = aRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Grades', () => {
    it('Teacher should create grade for assigned enrollment', () => {
        return request(app.getHttpServer())
            .post('/grades')
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({
                enrollmentId: enrollment1Id,
                moduleName: 'E2E Module',
                score: 18,
                feedback: 'Good job'
            })
            .expect(201);
    });

    it('Teacher should NOT create grade for unassigned enrollment', () => {
        return request(app.getHttpServer())
            .post('/grades')
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({
                enrollmentId: enrollment3Id,
                moduleName: 'E2E Module Unassigned',
                score: 10
            })
            .expect(403);
    });

    it('Student should see own grades', () => {
        return request(app.getHttpServer())
            .get(`/grades/enrollment/${enrollment1Id}`)
            .set('Authorization', `Bearer ${studentToken}`)
            .expect(200)
            .expect((res) => {
                expect(Array.isArray(res.body)).toBe(true);
            });
    });

    it('Student should NOT see others grades (403 or filtered?) Service throws 403', () => {
        return request(app.getHttpServer())
            .get(`/grades/enrollment/${enrollment3Id}`)
            .set('Authorization', `Bearer ${studentToken}`)
            .expect(403);
    });
  });

  describe('Certificates', () => {
      it('Admin should issue certificate', async () => {
          // Ensure no cert exists or rely on BadRequest logic if exists.
          // Let's revoke first to be safe or delete?
          await prisma.certificate.deleteMany({ where: { enrollmentId: enrollment1Id } });

          return request(app.getHttpServer())
            .post('/certificates/issue')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ enrollmentId: enrollment1Id })
            .expect(201)
            .expect((res) => {
                expect(res.body.status).toBe('ISSUED');
            });
      });

      it('Teacher should NOT issue certificate', () => {
          return request(app.getHttpServer())
            .post('/certificates/issue')
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({ enrollmentId: enrollment1Id })
            .expect(403);
      });
  });
});
