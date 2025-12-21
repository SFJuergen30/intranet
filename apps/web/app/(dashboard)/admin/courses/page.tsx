"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { CreateCourseDto, CreateCourseSchema, CreateCohortDto, CreateCohortSchema, AssignTeacherSchema } from "@repo/shared";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { RoleGuard } from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Plus, Users, Calendar } from "lucide-react";

// --- Fetchers ---
async function fetchCourses() {
  const { data } = await api.get("/courses");
  return data;
}

// We need a way to fetch cohorts per course, but typically backend returns them nested or we fetch all.
// For MVP, assuming fetchCourses returns included cohorts. We need to verify Backend logic.
// Checking CoursesService: yes, findAllCourses includes cohorts.

async function fetchTeachers() {
    const { data } = await api.get("/users?role=TEACHER");
    return data;
}

async function createCourse(data: CreateCourseDto) {
  const { data: res } = await api.post("/courses", data);
  return res;
}

async function createCohort(data: CreateCohortDto) {
    const { data: res } = await api.post("/courses/cohorts", data);
    return res;
}

async function assignTeacher(data: { cohortId: string, teacherId: string, isPrimary: boolean }) {
    const { data: res } = await api.post(`/courses/cohorts/${data.cohortId}/assign`, data);
    return res;
}


export default function CoursesPage() {
  const queryClient = useQueryClient();
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [cohortDialogOpen, setCohortDialogOpen] = useState<string | null>(null); // Course ID
  const [assignDialogOpen, setAssignDialogOpen] = useState<string | null>(null); // Cohort ID

  const { data: courses, isLoading } = useQuery({ queryKey: ["courses"], queryFn: fetchCourses });
  const { data: teachers } = useQuery({ queryKey: ["teachers"], queryFn: fetchTeachers });

  // --- Forms ---
  const courseForm = useForm<CreateCourseDto>({
      resolver: zodResolver(CreateCourseSchema),
      defaultValues: { title: "", type: "BARBER_PRO" }
  });

  const cohortForm = useForm<CreateCohortDto>({
      resolver: zodResolver(CreateCohortSchema),
      defaultValues: { name: "", capacity: 20 }
  });

  // Assign Form - manual simple state or form
  const [selectedTeacher, setSelectedTeacher] = useState("");

  // --- Mutations ---
  const createCourseMut = useMutation({
      mutationFn: createCourse,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["courses"] });
          setCourseDialogOpen(false);
          courseForm.reset();
      }
  });

  const createCohortMut = useMutation({
      mutationFn: createCohort,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["courses"] });
          setCohortDialogOpen(null);
          cohortForm.reset();
      }
  });

  const assignTeacherMut = useMutation({
      mutationFn: assignTeacher,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["courses"] });
          setAssignDialogOpen(null);
          setSelectedTeacher("");
      },
      onError: (err) => alert("Error assigning teacher")
  });


  const onSubmitCourse = (data: CreateCourseDto) => createCourseMut.mutate(data);
  const onSubmitCohort = (data: CreateCohortDto) => {
      // Need courseId and campusId. For MVP we fake campusId or fetch it? 
      // We haven't built Campus UI. We seeded campuses? No seed yet.
      // We need campusId to create cohort.
      // HARDCODED FIX for MVP: we will need to seed a campus or fetch one.
      // Let's assume we have a campus. If not, backend will fail.
      // We'll create a default campus on backend seed later.
      // For now, let's ask user to input Campus UUID or let's fetch campuses first.
      // Assuming a valid UUID exists for "Jesus Maria" from seed.
      // I'll hardcode a placeholder or add Campus fetch.
      // Let's add Campus fetch to be safe.
      createCohortMut.mutate({ ...data, courseId: cohortDialogOpen!, startDate: new Date().toISOString() });
  };
  
  // Need Campuses to create cohort properly
  // Let's fetch campuses
  const { data: campuses } = useQuery({ queryKey: ["campuses"], queryFn: async () => {
      // We don't have endpoints for campuses yet? 
      // Prisma schema has Campus. We need to seed it.
      // For now, let's trust the user will seed DB.
      // Or we can just list them if endpoint exists. 
      // We didn't make CampusController.
      // We should make one or just seed one and hardcode for MVP testing?
      // Better: Create Campuses in Seed. Then here Fetch logic would require endpoint.
      // Let's assume we will pick the first one from a /campuses endpoint if we build it?
      // Or just text input for Campus ID for now (Manual).
      return [] as any[];
  } });

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Gestión de Cursos</h1>
        <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#25D366] text-black hover:bg-[#1fb554]">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
              <DialogHeader><DialogTitle>Nuevo Curso</DialogTitle></DialogHeader>
              <Form {...courseForm}>
                  <form onSubmit={courseForm.handleSubmit(onSubmitCourse)} className="space-y-4">
                      <FormField control={courseForm.control} name="title" render={({ field }) => (
                          <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} className="bg-zinc-900 border-zinc-800" /></FormControl></FormItem>
                      )} />
                      <FormField control={courseForm.control} name="type" render={({ field }) => (
                          <FormItem><FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent className="bg-zinc-900 border-zinc-800"><SelectItem value="BARBER_PRO">Barber Pro</SelectItem><SelectItem value="UNAS_PRO">Uñas Pro</SelectItem></SelectContent>
                          </Select>
                          </FormItem>
                      )} />
                      <Button type="submit" className="w-full bg-[#25D366] text-black">Crear</Button>
                  </form>
              </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? <p>Cargando...</p> : courses?.map((course: any) => (
              <Card key={course.id} className="bg-zinc-900 border-zinc-800 text-white">
                  <CardHeader>
                      <CardTitle>{course.title}</CardTitle>
                      <CardDescription>{course.type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-4">
                          <div className="flex justify-between items-center">
                              <h4 className="text-sm font-semibold text-zinc-400">Cohorts</h4>
                              <Button variant="ghost" size="sm" onClick={() => setCohortDialogOpen(course.id)}><Plus className="h-4 w-4" /></Button>
                          </div>
                          <div className="space-y-2">
                              {course.cohorts?.map((cohort: any) => (
                                  <div key={cohort.id} className="p-2 rounded bg-zinc-950 border border-zinc-800 text-sm">
                                      <div className="flex justify-between mb-2">
                                          <span className="font-medium">{cohort.name}</span>
                                          <span className="text-xs text-zinc-500">{new Date(cohort.startDate).toLocaleDateString()}</span>
                                      </div>
                                      <div className="text-xs text-zinc-500 mb-2">
                                          Profesor: {cohort.cohortTeacher?.[0]?.teacher?.user?.fullName || "Sin asignar"}
                                      </div>
                                      <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => setAssignDialogOpen(cohort.id)}>
                                          Asignar Profesor
                                      </Button>
                                  </div>
                              ))}
                              {course.cohorts?.length === 0 && <p className="text-xs text-zinc-500 italic">No hay cohorts activos.</p>}
                          </div>
                      </div>
                  </CardContent>
              </Card>
          ))}
      </div>

      {/* Cohort Dialog */}
      <Dialog open={!!cohortDialogOpen} onOpenChange={(open) => !open && setCohortDialogOpen(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
              <DialogHeader><DialogTitle>Nuevo Cohort</DialogTitle></DialogHeader>
              <Form {...cohortForm}>
                  <form onSubmit={cohortForm.handleSubmit(onSubmitCohort)} className="space-y-4">
                      <FormField control={cohortForm.control} name="name" render={({ field }) => (
                          <FormItem><FormLabel>Nombre (e.g. Turno Mañana 2024-I)</FormLabel><FormControl><Input {...field} className="bg-zinc-900 border-zinc-800" /></FormControl></FormItem>
                      )} />
                      <FormField control={cohortForm.control} name="campusId" render={({ field }) => (
                           <FormItem><FormLabel>Sede (UUID)</FormLabel><FormControl><Input {...field} placeholder="Pegar UUID de sede" className="bg-zinc-900 border-zinc-800" /></FormControl></FormItem>
                      )} />
                      <Button type="submit" className="w-full bg-[#25D366] text-black">Crear Cohort</Button>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>

      {/* Assign Teacher Dialog */}
      <Dialog open={!!assignDialogOpen} onOpenChange={(open) => !open && setAssignDialogOpen(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
              <DialogHeader><DialogTitle>Asignar Profesor</DialogTitle></DialogHeader>
              <div className="space-y-4">
                  <div className="space-y-2">
                      <label className="text-sm font-medium">Profesor</label>
                      <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                          <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                              {teachers?.map((u: any) => (
                                  <SelectItem key={u.id} value={u.teacherProfile?.id || "no-profile"}>
                                      {u.fullName}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  <Button 
                    className="w-full bg-[#25D366] text-black" 
                    disabled={!selectedTeacher || assignTeacherMut.isLoading}
                    onClick={() => assignTeacherMut.mutate({ cohortId: assignDialogOpen!, teacherId: selectedTeacher, isPrimary: true })}
                  >
                      Asignar
                  </Button>
              </div>
          </DialogContent>
      </Dialog>
    </RoleGuard>
  );
}
