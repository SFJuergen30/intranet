"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { RoleGuard } from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Edit, Calendar, UserPlus } from "lucide-react";
import { format } from "date-fns";

const CohortSchema = z.object({
  name: z.string().min(3),
  courseId: z.string().min(1),
  campusId: z.string().min(1),
  schedule: z.string().min(3),
  startDate: z.string(),
  capacity: z.coerce.number().min(1),
});

const AssignTeacherSchema = z.object({
    teacherId: z.string().min(1, "Selecciona un profesor"),
    isPrimary: z.boolean().default(false),
});

type CohortFormValues = z.infer<typeof CohortSchema>;

export default function AdminCohortsPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Assignment State
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);


  const { data: cohorts, isLoading } = useQuery({
    queryKey: ["cohorts"],
    queryFn: async () => (await api.get("/courses/cohorts")).data,
  });

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => (await api.get("/courses")).data,
  });

   const { data: campuses } = useQuery({
    queryKey: ["campuses"],
    queryFn: async () => (await api.get("/campuses")).data,
  });
  
  const { data: teachers } = useQuery({
    queryKey: ["teachers"],
    enabled: assignOpen,
    queryFn: async () => (await api.get("/users?role=TEACHER")).data,
  });


  const form = useForm<CohortFormValues>({
    resolver: zodResolver(CohortSchema),
    defaultValues: { name: "", courseId: "", campusId: "", schedule: "", startDate: "", capacity: 20 },
  });
  
  const assignForm = useForm({
      resolver: zodResolver(AssignTeacherSchema),
      defaultValues: { teacherId: "", isPrimary: false }
  });

  const mutation = useMutation({
    mutationFn: async (data: CohortFormValues) => {
        if (editingId) return api.patch(`/courses/cohorts/${editingId}`, data);
        return api.post("/courses/cohorts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cohorts"] });
      setIsOpen(false);
      setEditingId(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/courses/cohorts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cohorts"] }),
  });
  
  const assignMutation = useMutation({
      mutationFn: async (data: any) => {
          return api.post(`/courses/cohorts/${selectedCohort}/assign`, data);
      },
      onSuccess: () => {
          setAssignOpen(false);
          assignForm.reset();
          alert("Docente asignado correctamente");
      },
      onError: () => alert("Error al asignar docente")
  });

  const handleEdit = (cohort: any) => {
      setEditingId(cohort.id);
      form.reset({
          name: cohort.name,
          courseId: cohort.courseId,
          campusId: cohort.campusId,
          schedule: cohort.schedule,
          startDate: cohort.startDate ? new Date(cohort.startDate).toISOString().split('T')[0] : "",
          capacity: cohort.capacity,
      });
      setIsOpen(true);
  };
  
  const handleAssign = (cohortId: string) => {
      setSelectedCohort(cohortId);
      setAssignOpen(true);
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Gestión de Cohortes (Grupos)</h1>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) { setEditingId(null); form.reset(); } }}>
          <DialogTrigger asChild>
            <Button className="bg-[#25D366] text-black hover:bg-[#1fb554]">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Cohorte
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Cohorte" : "Nuevo Cohorte"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Ref.</FormLabel>
                      <FormControl><Input {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Curso</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                         <FormControl>
                           <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Seleccionar Curso" /></SelectTrigger>
                         </FormControl>
                         <SelectContent className="bg-zinc-900 border-zinc-800">
                             {courses?.map((c: any) => (
                                 <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                             ))}
                         </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="campusId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sede</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                         <FormControl>
                           <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Seleccionar Sede" /></SelectTrigger>
                         </FormControl>
                         <SelectContent className="bg-zinc-900 border-zinc-800">
                             {campuses?.map((c: any) => (
                                 <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                             ))}
                         </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha Inicio</FormLabel>
                          <FormControl><Input type="date" {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vacantes</FormLabel>
                          <FormControl><Input type="number" {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                <FormField
                  control={form.control}
                  name="schedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horario</FormLabel>
                      <FormControl><Input {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full bg-[#25D366] text-black">
                    {mutation.isLoading ? "Guardando..." : "Guardar"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Assign Teacher Dialog */}
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader><DialogTitle>Asignar Docente</DialogTitle></DialogHeader>
                <Form {...assignForm}>
                    <form onSubmit={assignForm.handleSubmit((data) => assignMutation.mutate(data))} className="space-y-4">
                        <FormField
                            control={assignForm.control}
                            name="teacherId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Docente</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Seleccionar Docente" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-zinc-900 border-zinc-800">
                                            {teachers?.filter((t: any) => t.teacherProfile).map((t: any) => (
                                                <SelectItem key={t.teacherProfile.id} value={t.teacherProfile.id}>{t.fullName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={assignForm.control}
                            name="isPrimary"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-zinc-800 rounded">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Docente Principal</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full bg-[#25D366] text-black">Asignar</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-zinc-800">
          <Table>
              <TableHeader className="bg-zinc-900">
                  <TableRow className="border-zinc-800 hover:bg-zinc-900">
                      <TableHead>Cohorte</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {isLoading ? <TableRow><TableCell colSpan={4} className="text-center">Cargando...</TableCell></TableRow> :
                   cohorts?.map((cohort: any) => (
                       <TableRow key={cohort.id} className="border-zinc-800 hover:bg-zinc-900">
                           <TableCell className="font-medium">
                               <div>{cohort.name}</div>
                               <div className="text-xs text-zinc-500">{cohort.campus?.name}</div>
                           </TableCell>
                           <TableCell>{cohort.course?.title}</TableCell>
                           <TableCell>{cohort.schedule}</TableCell>
                           <TableCell className="text-right flex justify-end gap-2">
                               <Button variant="outline" size="sm" onClick={() => handleAssign(cohort.id)} title="Asignar Docente">
                                   <UserPlus className="h-4 w-4" />
                               </Button>
                               <Button variant="ghost" size="icon" onClick={() => handleEdit(cohort)}><Edit className="h-4 w-4 text-blue-500" /></Button>
                               <Button variant="ghost" size="icon" onClick={() => { if(confirm("Eliminar?")) deleteMutation.mutate(cohort.id) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                           </TableCell>
                       </TableRow>
                   ))}
              </TableBody>
          </Table>
      </div>
    </RoleGuard>
  );
}
