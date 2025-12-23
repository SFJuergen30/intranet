"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { RoleGuard } from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, UserPlus } from "lucide-react";
import { format } from "date-fns";

const EnrollmentSchema = z.object({
  studentId: z.string().min(1, "Selecciona un estudiante"),
  cohortId: z.string().min(1, "Selecciona un cohorte"),
});

type EnrollmentFormValues = z.infer<typeof EnrollmentSchema>;

export default function AdminEnrollmentsPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch Enrollments
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["enrollments"],
    queryFn: async () => (await api.get("/enrollments")).data,
  });

  // Fetch Sudents (We need a way to filter only students, or the backend should provide it)
  // Currently /users might return everyone. Should we filter on client or backend? Client for now if list is small.
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get("/users")).data,
  });
  const students = users?.filter((u: any) => u.role === "STUDENT" && u.studentProfile?.id) || [];

  // Fetch Cohorts
  const { data: cohorts } = useQuery({
    queryKey: ["cohorts"],
    queryFn: async () => (await api.get("/courses/cohorts")).data,
  });


  const form = useForm<EnrollmentFormValues>({
    resolver: zodResolver(EnrollmentSchema),
    defaultValues: { studentId: "", cohortId: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: EnrollmentFormValues) => {
        return api.post("/enrollments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      setIsOpen(false);
      form.reset();
    },
    onError: (err: any) => {
        alert(err.response?.data?.message || "Error al matricular");
    }
  });


  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Gestión de Matrículas</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#25D366] text-black hover:bg-[#1fb554]">
              <UserPlus className="mr-2 h-4 w-4" /> Nueva Matrícula
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>Matricular Estudiante</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                 <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estudiante</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                         <FormControl>
                           <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Buscar estudiante" /></SelectTrigger>
                         </FormControl>
                         <SelectContent className="bg-zinc-900 border-zinc-800 max-h-60 overflow-y-auto">
                             {students.map((s: any) => (
                                 <SelectItem key={s.studentProfile.id} value={s.studentProfile.id}>
                                     {s.fullName} ({s.email})
                                 </SelectItem>
                             ))}
                         </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="cohortId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cohorte (Grupo)</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                         <FormControl>
                           <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Seleccionar grupo" /></SelectTrigger>
                         </FormControl>
                         <SelectContent className="bg-zinc-900 border-zinc-800 max-h-60 overflow-y-auto">
                             {cohorts?.map((c: any) => (
                                 <SelectItem key={c.id} value={c.id}>
                                     {c.name} - {c.course.title} ({c.campus.name})
                                 </SelectItem>
                             ))}
                         </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full bg-[#25D366] text-black">
                    {mutation.isLoading ? "Procesando..." : "Matricular"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-zinc-800">
          <Table>
              <TableHeader className="bg-zinc-900">
                  <TableRow className="border-zinc-800 hover:bg-zinc-900">
                      <TableHead>Estudiante</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Cohorte</TableHead>
                      <TableHead>Sede</TableHead>
                      <TableHead>Fecha Matricula</TableHead>
                      <TableHead>Estado</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {isLoading ? <TableRow><TableCell colSpan={6} className="text-center">Cargando...</TableCell></TableRow> :
                   enrollments?.map((e: any) => (
                       <TableRow key={e.id} className="border-zinc-800 hover:bg-zinc-900">
                           <TableCell className="font-medium">
                               <div>{e.student.user.fullName}</div>
                               <div className="text-xs text-zinc-500">{e.student.user.email}</div>
                           </TableCell>
                           <TableCell>{e.cohort.course.title}</TableCell>
                           <TableCell>{e.cohort.name}</TableCell>
                           <TableCell>{e.cohort.campus.name}</TableCell>
                           <TableCell>{format(new Date(e.enrolledAt), 'dd/MM/yyyy')}</TableCell>
                           <TableCell>
                               <span className={`px-2 py-1 rounded text-xs font-bold ${e.status === 'ACTIVE' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                   {e.status}
                               </span>
                           </TableCell>
                       </TableRow>
                   ))}
              </TableBody>
          </Table>
      </div>
    </RoleGuard>
  );
}
