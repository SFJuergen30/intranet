"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { RoleGuard } from "@/components/auth/role-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { CreateGradeDto } from "@repo/shared";
import { useParams, useRouter } from "next/navigation";

// Fetch Cohort Details (with enrollments)
async function fetchCohort(id: string) {
    const { data } = await api.get(`/courses/cohorts/${id}`);
    return data;
}

// Create Grade
async function createGrade(data: CreateGradeDto) {
    const { data: res } = await api.post("/grades", data);
    return res;
}

export default function CohortGradesPage() {
  const params = useParams();
  const cohortId = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: cohort, isLoading } = useQuery({ 
      queryKey: ["cohort", cohortId], 
      queryFn: () => fetchCohort(cohortId),
      enabled: !!cohortId
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [moduleName, setModuleName] = useState("");
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState("");

  const mutation = useMutation({
      mutationFn: createGrade,
      onSuccess: () => {
          setModalOpen(false);
          setModuleName("");
          setScore(0);
          setFeedback("");
          alert("Nota registrada correctamente");
          // Optionally invalidate if we showed grades in the list (not yet implemented in list)
      },
      onError: (err: any) => {
          alert("Error al registrar nota: " + (err.response?.data?.message || err.message));
      }
  });

  const handleOpenGrade = (enrollment: any) => {
      setSelectedEnrollment(enrollment);
      setModalOpen(true);
  };

  const handleSubmit = () => {
      if (!selectedEnrollment) return;
      mutation.mutate({
          enrollmentId: selectedEnrollment.id,
          moduleName,
          score: Number(score),
          feedback
      });
  };

  if (isLoading) return <p className="p-8">Cargando datos del grupo...</p>;
  if (!cohort) return <p className="p-8">Grupo no encontrado o sin acceso.</p>;

  return (
    <RoleGuard allowedRoles={["TEACHER"]}>
      <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
                <Button variant="ghost" onClick={() => router.back()} className="mb-2">← Volver</Button>
                <h1 className="text-3xl font-bold">{cohort.name} - Calificaciones</h1>
                <p className="text-zinc-400">Curso: {cohort.course?.title}</p>
            </div>
          </div>

          <Card className="bg-zinc-900 border-zinc-800 text-white">
              <CardHeader>
                  <CardTitle>Listado de Estudiantes</CardTitle>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow className="border-zinc-800">
                              <TableHead>Estudiante</TableHead>
                              <TableHead>DNI</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {cohort.enrollments?.map((enrollment: any) => (
                              <TableRow key={enrollment.id} className="border-zinc-800">
                                  <TableCell>{enrollment.student?.user?.fullName}</TableCell>
                                  <TableCell>{enrollment.student?.dni || "-"}</TableCell>
                                  <TableCell className="text-right">
                                      <Button 
                                        size="sm" 
                                        className="bg-[#25D366] text-black hover:bg-[#1fb554]"
                                        onClick={() => handleOpenGrade(enrollment)}
                                      >
                                          Calificar
                                      </Button>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </CardContent>
          </Card>

          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                  <DialogHeader>
                      <DialogTitle>Registrar Nota</DialogTitle>
                      <DialogDescription>
                          Estudiante: {selectedEnrollment?.student?.user?.fullName}
                      </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                      <div className="space-y-2">
                          <Label>Nombre del Módulo</Label>
                          <Input 
                            placeholder="Ej. Corte Clásico" 
                            value={moduleName}
                            onChange={(e) => setModuleName(e.target.value)}
                            className="bg-zinc-900 border-zinc-700"
                          />
                      </div>
                      <div className="space-y-2">
                          <Label>Nota (0-20)</Label>
                          <Input 
                            type="number"
                            min="0" max="20"
                            value={score}
                            onChange={(e) => setScore(Number(e.target.value))}
                            className="bg-zinc-900 border-zinc-700"
                          />
                      </div>
                      <div className="space-y-2">
                          <Label>Feedback (Opcional)</Label>
                          <Input 
                            placeholder="Comentario sobre el desempeño..." 
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="bg-zinc-900 border-zinc-700"
                          />
                      </div>
                  </div>
                  <DialogFooter>
                      <Button variant="outline" onClick={() => setModalOpen(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-white">Cancelar</Button>
                      <Button onClick={handleSubmit} disabled={mutation.isLoading} className="bg-[#25D366] text-black hover:bg-[#1fb554]">
                          {mutation.isLoading ? "Guardando..." : "Guardar Nota"}
                      </Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      </div>
    </RoleGuard>
  );
}
