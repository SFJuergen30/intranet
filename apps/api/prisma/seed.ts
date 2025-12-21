import { PrismaClient, Role, MaterialVisibility, CourseType, CertificateStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // --- 1. Campuses (Sedes) ---
  const campuses = [
    { name: 'Jesus Maria', address: 'Av. Salaverry 123' },
    { name: 'Surco', address: 'Av. Primavera 456' },
    { name: 'Callao', address: 'Av. Saenz Peña 789' },
  ];

  const campusMap = new Map();

  for (const c of campuses) {
    const campus = await prisma.campus.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
    campusMap.set(c.name, campus.id);
    console.log(`Upserted Campus: ${c.name}`);
  }

  // --- 2. Users (Admin, Teachers, Students) ---
  const usersData = [
    {
      email: 'admin@blackwhiteacademy.com',
      password: 'Admin123!',
      fullName: 'Admin User',
      role: Role.ADMIN,
    },
    {
        email: 'teacher1@blackwhiteacademy.com',
        password: 'Teacher123!',
        fullName: 'Teacher One',
        role: Role.TEACHER,
        profile: { specialty: "Barberia" }
    },
    {
        email: 'teacher2@blackwhiteacademy.com',
        password: 'Teacher123!',
        fullName: 'Teacher Two',
        role: Role.TEACHER,
        profile: { specialty: "Manicure" }
    },
    {
        email: 'student1@blackwhiteacademy.com',
        password: 'Student123!',
        fullName: 'Student One',
        role: Role.STUDENT,
        profile: { dni: "10000001" }
    },
    {
        email: 'student2@blackwhiteacademy.com',
        password: 'Student123!',
        fullName: 'Student Two',
        role: Role.STUDENT,
        profile: { dni: "10000002" }
    },
    {
        email: 'student3@blackwhiteacademy.com',
        password: 'Student123!',
        fullName: 'Student Three',
        role: Role.STUDENT,
        profile: { dni: "10000003" }
    },
  ];

  const userMap = new Map();

  for (const u of usersData) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {}, // Don't overwrite if exists
      create: {
        email: u.email,
        fullName: u.fullName,
        passwordHash,
        role: u.role,
        // Create profile transactionally
        teacherProfile: u.role === Role.TEACHER ? { create: u.profile } : undefined,
        studentProfile: u.role === Role.STUDENT ? { create: u.profile } : undefined,
      },
      include: { teacherProfile: true, studentProfile: true }
    });
    userMap.set(u.email, user);
    console.log(`Upserted User: ${u.email}`);
  }

  // --- 3. Courses ---
  const coursesData = [
      { title: "Barber PRO", type: CourseType.BARBER_PRO, description: "Curso completo de barbería profesional." },
      { title: "Uñas PRO", type: CourseType.UNAS_PRO, description: "Curso experto en sistema de uñas." },
      { title: "Barbería Online", type: CourseType.ONLINE, description: "Curso virtual de fundamentos." },
  ];

  const courseMap = new Map(); // Title -> ID

  for (const c of coursesData) {
      const course = await prisma.course.upsert({
          where: { title: c.title },
          update: {},
          create: c
      });
      courseMap.set(c.title, course.id);
      console.log(`Upserted Course: ${c.title}`);
  }

  // --- 4. Cohorts (Assignments & Schedule) ---
  const today = new Date();
  
  const cohortsData = [
      {
          name: "Turno Mañana 2024-I",
          courseId: courseMap.get("Barber PRO"),
          campusId: campusMap.get("Jesus Maria"),
          teacherEmail: "teacher1@blackwhiteacademy.com",
          startDate: today,
          schedule: "Lun-Mie-Vie 9:00-13:00"
      },
      {
        name: "Turno Tarde 2024-I",
        courseId: courseMap.get("Uñas PRO"),
        campusId: campusMap.get("Surco"),
        teacherEmail: "teacher2@blackwhiteacademy.com",
        startDate: today,
        schedule: "Mar-Jue 14:00-18:00"
    }
  ];

  const cohortMap = new Map();

  for (const c of cohortsData) {
      const existing = await prisma.cohort.findFirst({
          where: { name: c.name, courseId: c.courseId }
      });

      let cohort;
      if (!existing) {
          cohort = await prisma.cohort.create({
              data: {
                  name: c.name,
                  courseId: c.courseId,
                  campusId: c.campusId,
                  startDate: c.startDate,
                  schedule: c.schedule,
                  capacity: 20
              }
          });
          console.log(`Created Cohort: ${c.name}`);
      } else {
          cohort = existing;
      }
      cohortMap.set(c.name, cohort.id);

      // Assign Teacher
      const teacherUser = userMap.get(c.teacherEmail);
      if (teacherUser && teacherUser.teacherProfile) {
          // Check assignment
          const assignment = await prisma.cohortTeacher.findFirst({
              where: { cohortId: cohort.id, teacherId: teacherUser.teacherProfile.id }
          });
          if (!assignment) {
              await prisma.cohortTeacher.create({
                  data: {
                      cohortId: cohort.id,
                      teacherId: teacherUser.teacherProfile.id,
                      isPrimary: true
                  }
              });
              console.log(`Assigned ${c.teacherEmail} to ${c.name}`);
          }
      }
  }

  // --- 5. Enrollments ---
  const enrollmentsData = [
      { studentEmail: "student1@blackwhiteacademy.com", cohortName: "Turno Mañana 2024-I" },
      { studentEmail: "student2@blackwhiteacademy.com", cohortName: "Turno Mañana 2024-I" },
      { studentEmail: "student3@blackwhiteacademy.com", cohortName: "Turno Tarde 2024-I" }
  ];

  const enrollmentMap = new Map(); // Key: email-cohort -> id

  for (const e of enrollmentsData) {
      const studentUser = userMap.get(e.studentEmail);
      const cohortId = cohortMap.get(e.cohortName);

      if (studentUser && studentUser.studentProfile && cohortId) {
          const exists = await prisma.enrollment.findFirst({
              where: { studentId: studentUser.studentProfile.id, cohortId }
          });
          
          let enrollment;
          if (!exists) {
              enrollment = await prisma.enrollment.create({
                  data: {
                      studentId: studentUser.studentProfile.id,
                      cohortId,
                      status: 'ACTIVE'
                  }
              });
              console.log(`Enrolled ${e.studentEmail} in ${e.cohortName}`);
          } else {
              enrollment = exists;
          }
          enrollmentMap.set(`${e.studentEmail}-${e.cohortName}`, enrollment.id);
      }
  }

  // --- 6. Attendance Sample ---
  const enrollmentId = enrollmentMap.get("student1@blackwhiteacademy.com-Turno Mañana 2024-I");
  if (enrollmentId) {
      const dates = [
          new Date(today.getTime() - 86400000 * 2), // 2 days ago
          new Date(today.getTime() - 86400000 * 1), // Yesterday
      ];

      for (const d of dates) {
          const exists = await prisma.attendance.findFirst({
              where: { enrollmentId, date: d }
          });
          if (!exists) {
              await prisma.attendance.create({
                  data: {
                      enrollmentId,
                      date: d,
                      isPresent: true,
                      notes: "Seed Data"
                  }
              });
              console.log(`Marked attendance for Student 1 on ${d.toISOString()}`);
          }
      }
  }

  // --- 7. Grades ---
  // Teacher 1 (Barberia) grades Student 1 and 2
  const teacher1User = userMap.get('teacher1@blackwhiteacademy.com');
  const e1 = enrollmentMap.get("student1@blackwhiteacademy.com-Turno Mañana 2024-I");
  const e2 = enrollmentMap.get("student2@blackwhiteacademy.com-Turno Mañana 2024-I");

  if (teacher1User && e1 && e2) {
      // Grade e1
      await prisma.grade.upsert({
          where: { enrollmentId_moduleName: { enrollmentId: e1, moduleName: 'Corte Clásico' } },
          update: {},
          create: {
              enrollmentId: e1,
              moduleName: 'Corte Clásico',
              score: 18,
              feedback: 'Excelente técnica',
              gradedByTeacherId: teacher1User.id
          }
      });
      console.log('Seeded Grade 1');

      // Grade e2
       await prisma.grade.upsert({
          where: { enrollmentId_moduleName: { enrollmentId: e2, moduleName: 'Corte Clásico' } },
          update: {},
          create: {
              enrollmentId: e2,
              moduleName: 'Corte Clásico',
              score: 15,
              feedback: 'Buen trabajo, mejorar postura',
              gradedByTeacherId: teacher1User.id
          }
      });
      console.log('Seeded Grade 2');
  }

  // --- 8. Certificates ---
  // Admin issues certificate for Student 1
  const adminUser = userMap.get('admin@blackwhiteacademy.com');
  if (adminUser && e1) {
      const existingCert = await prisma.certificate.findFirst({ where: { enrollmentId: e1 } });
      if (!existingCert) {
          await prisma.certificate.create({
              data: {
                  enrollmentId: e1,
                  issuedByAdminId: adminUser.id,
                  certificateNumber: 'CERT-DEMO-001',
                  status: CertificateStatus.ISSUED,
                  certificateUrl: 'https://placeholder.com/certificate.pdf'
              }
          });
          console.log('Seeded Certificate for Student 1');
      }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
