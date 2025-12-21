"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { RoleGuard } from "@/components/auth/role-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Users, CheckSquare } from "lucide-react";

// --- Fetchers ---
async function fetchMyCohorts() {
    const { data } = await api.get("/courses/cohorts");
    return data;
}

async function fetchEnrollments(cohortId: string) {
    const { data } = await api.get(`/enrollments/cohort/${cohortId}`);
    return data;
}

export default function TeacherDashboard() {
  const { data: cohorts, isLoading } = useQuery({ queryKey: ["myCohorts"], queryFn: fetchMyCohorts });

  return (
    <RoleGuard allowedRoles={["TEACHER"]}>
      <h1 className="mb-6 text-3xl font-bold">Mis Grupos</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p>Cargando cursos asignados...</p>}
        {cohorts?.map((cohort: any) => (
            <Card key={cohort.id} className="bg-zinc-900 border-zinc-800 text-white hover:border-zinc-700 transition-colors">
                <CardHeader>
                    <CardTitle>{cohort.name}</CardTitle>
                    <CardDescription>Curso: {cohort.course?.title}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-zinc-400 mb-4">
                        <Users className="h-4 w-4" />
                        <span>{cohort._count?.enrollments || 0} Estudiantes</span>
                    </div>
                    <div className="flex gap-2 w-full">
                        <Button asChild className="flex-1 bg-zinc-800 hover:bg-zinc-700">
                            <Link href={`/teacher/cohorts/${cohort.id}/attendance`}>
                                <CheckSquare className="mr-2 h-4 w-4" /> Asistencia
                            </Link>
                        </Button>
                        <Button asChild className="flex-1 bg-gold-500 text-black hover:bg-gold-400">
                            <Link href={`/teacher/cohorts/${cohort.id}/grades`}>
                                <CalendarCheck className="mr-2 h-4 w-4" /> Notas
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        ))}
        {cohorts?.length === 0 && <p>No tienes cursos asignados.</p>}
      </div>
    </RoleGuard>
  );
}
