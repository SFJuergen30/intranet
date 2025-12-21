# Black & White Academy Intranet

## Overview

This is a Monorepo containing the Intranet for Black & White Academy.

- **apps/web**: Next.js 15 Frontend (Admin, Teacher, Student portals).
- **apps/api**: NestJS Backend (RBAC, Auth, Prisma).
- **packages/shared**: Shared types and schemas.

## Prerequisites

- Node.js 18+
- Docker & Docker Compose (Required for Database)

## Setup Instructions

1. **Install Dependencies**:

   ```bash
   npm install
   ```

   (We use `npm` workspaces. `turbo` is installed as a dependency).

2. **Environment Variables**:
   Copy `.env.example` to `.env` in `apps/api` and `apps/web`.

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

3. **Start Database**:

   ```bash
   docker compose up -d
   ```

   _Note: If `docker compose` is not available, ensure Docker Desktop is installed and running._

4. **Database Migration**:
   Run the Prisma migration to create tables.

   ```bash
   cd apps/api
   npx prisma migrate dev --name init

   # Seed Data (Demo Users, Courses, Attendance)
   npx prisma db seed
   ```

5. **Start Development**:
   From the root:
   ```bash
   npm run dev
   ```
   This will start both `web` (localhost:3000) and `api` (localhost:3001) via Turbo.

## Demo Credentials

| Role          | Email                            | Password      |
| ------------- | -------------------------------- | ------------- |
| **Admin**     | `admin@blackwhiteacademy.com`    | `Admin123!`   |
| **Teacher 1** | `teacher1@blackwhiteacademy.com` | `Teacher123!` |
| **Teacher 2** | `teacher2@blackwhiteacademy.com` | `Teacher123!` |
| **Student 1** | `student1@blackwhiteacademy.com` | `Student123!` |
| **Student 2** | `student2@blackwhiteacademy.com` | `Student123!` |
| **Student 3** | `student3@blackwhiteacademy.com` | `Student123!` |

## Architecture Highlights

- **Auth**: JWT with HTTPOnly Cookie for Refresh Token. Access Tokens stored in memory.
- **RBAC**: Guards for `ADMIN`, `TEACHER`, `STUDENT`.
- **Resource Access**: `CohortAccessGuard` ensures Teachers only see their assigned groups.
- **Audit**: All critical actions are logged in `AuditLog` table.

## Branding

- **Colors**: Black & White base with `#25D366` (Green) accents.
- **UI**: Shadcn/UI + TailwindCSS.
