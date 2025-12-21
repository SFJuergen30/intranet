"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { RoleGuard } from "@/components/auth/role-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Award } from "lucide-react";

// Fetch My Enrollments
async function fetchMyEnrollments() {
    const { data } = await api.get("/enrollments/my-enrollments");
    return data;
}

// Fetch Grades for Enrollment
async function fetchGrades(enrollmentId: string) {
    const { data } = await api.get(`/grades/enrollment/${enrollmentId}`);
    return data;
}

// Fetch Certificate for Enrollment
async function fetchCertificate(enrollmentId: string) {
    try {
        const { data } = await api.get(`/certificates/enrollment/${enrollmentId}`);
        return data;
    } catch (e) {
        return null; 
    }
}

function EnrollmentGrades({ enrollment }: { enrollment: any }) {
    const { data: grades, isLoading: gradesLoading } = useQuery({
        queryKey: ["grades", enrollment.id],
        queryFn: () => fetchGrades(enrollment.id)
    });

    const { data: certificate } = useQuery({
        queryKey: ["certificate", enrollment.id],
        queryFn: () => fetchCertificate(enrollment.id)
    });

    return (
        <Card className="bg-zinc-900 border-zinc-800 text-white mb-6">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{enrollment.cohort?.name}</CardTitle>
                        <CardDescription>Curso: {enrollment.cohort?.course?.title}</CardDescription>
                    </div>
                    {certificate && (
                        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">
                            <Award className="w-3 h-3 mr-1" />
                            Certificado Emitido
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <h3 className="text-sm font-medium text-zinc-400 mb-2">Mis Calificaciones</h3>
                {gradesLoading ? <p>Cargando notas...</p> : (
                    grades && grades.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-800">
                                    <TableHead>Módulo</TableHead>
                                    <TableHead>Nota</TableHead>
                                    <TableHead>Feedback</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {grades.map((grade: any) => (
                                    <TableRow key={grade.id} className="border-zinc-800">
                                        <TableCell>{grade.moduleName}</TableCell>
                                        <TableCell>
                                            <span className={grade.score >= 13 ? "text-green-500" : "text-red-500"}>
                                                {grade.score}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-zinc-400 text-sm">{grade.feedback || "-"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm text-zinc-500">No hay notas registradas aún.</p>
                    )
                )}
            </CardContent>
            {certificate && (
                <CardFooter className="border-t border-zinc-800 pt-4 flex justify-end">
                    <Button 
                        variant="outline" 
                        className="border-yellow-600 text-yellow-500 hover:bg-yellow-900/20"
                        onClick={() => window.open(certificate.certificateUrl, '_blank')}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Descargar Certificado
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}

export default function StudentGradesPage() {
  const { data: enrollments, isLoading } = useQuery({ 
      queryKey: ["myEnrollments"], 
      queryFn: fetchMyEnrollments 
  });

  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Mis Notas y Certificados</h1>
          
          {isLoading && <p>Cargando cursos...</p>}
          
          <div className="space-y-6">
              {enrollments?.map((enrollment: any) => (
                  <EnrollmentGrades key={enrollment.id} enrollment={enrollment} />
              ))}
              {enrollments?.length === 0 && <p>No estás matriculado en ningún curso.</p>}
          </div>
      </div>
    </RoleGuard>
  );
}
