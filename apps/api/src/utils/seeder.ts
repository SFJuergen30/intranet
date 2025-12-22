import { PrismaClient, Role, CourseType, CertificateStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function seedDatabase(prisma: PrismaClient) {
  console.log('🌱 Starting Auto-Seed...');

  // 1. Ensure Admin User
  const adminEmail = 'admin@blackwhiteacademy.com';
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!adminExists) {
    console.log('Creating Admin User...');
    const hash = await bcrypt.hash('Admin123!', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hash,
        fullName: 'Admin User',
        role: Role.ADMIN,
      },
    });
  }

  // 2. Ensure Teacher User
  const teacherEmail = 'teacher1@blackwhiteacademy.com';
  const teacherExists = await prisma.user.findUnique({ where: { email: teacherEmail } });

  if (!teacherExists) {
    console.log('Creating Teacher User...');
    const hash = await bcrypt.hash('Teacher123!', 10);
    await prisma.user.create({
      data: {
        email: teacherEmail,
        passwordHash: hash,
        fullName: 'Teacher One',
        role: Role.TEACHER,
        teacherProfile: {
          create: { specialty: 'Barberia' },
        },
      },
    });
  }

  // 3. Ensure Student User
  const studentEmail = 'student1@blackwhiteacademy.com';
  const studentExists = await prisma.user.findUnique({ where: { email: studentEmail } });

  if (!studentExists) {
    console.log('Creating Student User...');
    const hash = await bcrypt.hash('Student123!', 10);
    await prisma.user.create({
      data: {
        email: studentEmail,
        passwordHash: hash,
        fullName: 'Student One',
        role: Role.STUDENT,
        studentProfile: {
          create: { dni: '10000001' },
        },
      },
    });
  }
  
  console.log('✅ Auto-Seed Complete.');
}
