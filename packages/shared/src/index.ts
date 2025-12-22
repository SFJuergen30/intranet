import { z } from "zod";

// --- Enums ---
export const RoleEnum = z.enum(["ADMIN", "TEACHER", "STUDENT"]);
export const CourseTypeEnum = z.enum(["BARBER_PRO", "UNAS_PRO", "ONLINE", "SEMINARIO"]);
export const MaterialVisibilityEnum = z.enum(["STUDENTS", "TEACHERS", "BOTH"]);
export const EnrollmentStatusEnum = z.enum(["ACTIVE", "COMPLETED", "DROPPED"]);

// --- Auth Schemas ---
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(3),
  role: RoleEnum,
  scheduleUrl: z.string().url().optional().or(z.literal('')),
  paymentScheduleUrl: z.string().url().optional().or(z.literal('')),
  resourceLinks: z.array(z.object({ name: z.string(), url: z.string().url() })).optional(),
});

// --- User Schemas ---
export const UpdateUserSchema = z.object({
  fullName: z.string().min(3).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
});

export const CreateStudentProfileSchema = z.object({
  dni: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const CreateTeacherProfileSchema = z.object({
  specialty: z.string().optional(),
  bio: z.string().optional(),
});

// --- Course Schemas ---
export const CreateCourseSchema = z.object({
  title: z.string().min(3),
  type: CourseTypeEnum,
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export const UpdateCourseSchema = CreateCourseSchema.partial();

// --- Cohort Schemas ---
export const CreateCohortSchema = z.object({
  courseId: z.string().uuid(),
  campusId: z.string().uuid(),
  name: z.string().min(2),
  startDate: z.string().datetime(), // ISO string
  schedule: z.string().optional(),
  capacity: z.number().int().positive().default(20),
});

export const AssignTeacherSchema = z.object({
  cohortId: z.string().uuid(),
  teacherId: z.string().uuid(), // TeacherProfile ID
  isPrimary: z.boolean().default(false),
});

// --- Enrollment Schemas ---
export const CreateEnrollmentSchema = z.object({
  studentId: z.string().uuid(), // StudentProfile ID
  cohortId: z.string().uuid(),
});

export const ConnectStudentParams = z.object({
    userId: z.string().uuid(),
})

// --- Attendance Schemas ---
export const MarkAttendanceItemSchema = z.object({
  enrollmentId: z.string().uuid(),
  isPresent: z.boolean(),
  notes: z.string().optional(),
});

export const MarkAttendanceSchema = z.object({
  date: z.string().datetime(),
  items: z.array(MarkAttendanceItemSchema),
});


export type LoginDto = z.infer<typeof LoginSchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type CreateCourseDto = z.infer<typeof CreateCourseSchema>;
export type CreateCohortDto = z.infer<typeof CreateCohortSchema>;
export type CreateEnrollmentDto = z.infer<typeof CreateEnrollmentSchema>;
export type MarkAttendanceDto = z.infer<typeof MarkAttendanceSchema>;

// --- Grade Schemas ---
export const CreateGradeSchema = z.object({
  enrollmentId: z.string().uuid(),
  moduleName: z.string().min(3).trim(),
  score: z.number().min(0).max(20), // Validated Range 0-20
  feedback: z.string().optional(),
});

export const UpdateGradeSchema = z.object({
  score: z.number().min(0).max(20).optional(),
  feedback: z.string().optional(),
});

// --- Certificate Schemas ---
export const IssueCertificateSchema = z.object({
  enrollmentId: z.string().uuid(),
});

export type CreateGradeDto = z.infer<typeof CreateGradeSchema>;
export type UpdateGradeDto = z.infer<typeof UpdateGradeSchema>;
export type IssueCertificateDto = z.infer<typeof IssueCertificateSchema>;
