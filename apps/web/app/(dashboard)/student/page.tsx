"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { RoleGuard } from "@/components/auth/role-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Need Badge? I'll use simple span or create Badge later. Using span for now.
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarCheck, GraduationCap, Clock } from "lucide-react";

// --- Fetchers ---
async function fetchMyEnrollments() {
    const { data } = await api.get("/enrollments/my-enrollments");
    return data;
}

async function fetchAttendance(enrollmentId: string) {
    const { data } = await api.get(`/attendance/enrollment/${enrollmentId}`);
    return data;
}

export default function StudentDashboard() {
  const [selectedEnrollment, setSelectedEnrollment] = useState<string | null>(null);

  const { data: enrollments, isLoading } = useQuery({ queryKey: ["myEnrollments"], queryFn: fetchMyEnrollments });

  const { data: attendanceHistory, isLoading: loadingAttendance } = useQuery({
      queryKey: ["attendance", selectedEnrollment],
      queryFn: () => fetchAttendance(selectedEnrollment!),
      enabled: !!selectedEnrollment
  });

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'ACTIVE': return 'text-green-500 border-green-500';
          case 'COMPLETED': return 'text-blue-500 border-blue-500';
          case 'DROPPED': return 'text-red-500 border-red-500';
          default: return 'text-zinc-500 border-zinc-500';
      }
  };

  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <h1 className="mb-6 text-3xl font-bold">Mis Cursos</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p>Cargando cursos...</p>}
        {enrollments?.map((enrollment: any) => (
            <Card key={enrollment.id} className="bg-zinc-900 border-zinc-800 text-white hover:border-zinc-700 transition-colors">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{enrollment.cohort?.course?.title}</CardTitle>
                            <CardDescription className="mt-1">{enrollment.cohort?.name}</CardDescription>
                        </div>
                        <Badge variant="outline" className={getStatusColor(enrollment.status)}>
                            {enrollment.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <CalendarCheck className="h-4 w-4" />
                            <span>Incio: {new Date(enrollment.cohort?.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <Clock className="h-4 w-4" />
                            <span>Horario: {enrollment.cohort?.schedule || "Por definir"}</span>
                        </div>
                        
                        <Dialog open={selectedEnrollment === enrollment.id} onOpenChange={(open) => !open && setSelectedEnrollment(null)}>
                            <DialogTrigger asChild>
                                <Button className="w-full bg-zinc-800 hover:bg-zinc-700 mt-2" onClick={() => setSelectedEnrollment(enrollment.id)}>
                                    Ver Asistencia
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Historial de Asistencia - {enrollment.cohort?.course?.title}</DialogTitle>
                                </DialogHeader>
                                <div className="mt-4">
                                    {loadingAttendance ? <p>Cargando historia...</p> : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-zinc-800">
                                                    <TableHead>Fecha</TableHead>
                                                    <TableHead>Estado</TableHead>
                                                    <TableHead>Notas</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {attendanceHistory?.map((record: any) => (
                                                    <TableRow key={record.id} className="border-zinc-800">
                                                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                                                        <TableCell>
                                                            {record.isPresent ? (
                                                                <span className="text-green-500 font-bold">Presente</span>
                                                            ) : (
                                                                <span className="text-red-500 font-bold">Ausente</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-zinc-500 text-sm">{record.notes || "-"}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {attendanceHistory?.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No hay registros de asistencia.</TableCell></TableRow>}
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>
        ))}
        {enrollments?.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No estás inscrito en ningún curso actualmente.</p>
            </div>
        )}
      </div>
    </RoleGuard>
  );
}
