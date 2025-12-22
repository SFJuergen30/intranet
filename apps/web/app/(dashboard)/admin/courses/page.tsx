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
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit } from "lucide-react";

// Schema manually here or import from shared if exists
const CourseSchema = z.object({
  title: z.string().min(3),
  type: z.enum(["BARBER_PRO", "UNAS_PRO", "ONLINE", "SEMINARIO"]),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

type CourseFormValues = z.infer<typeof CourseSchema>;

export default function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => (await api.get("/courses")).data,
  });

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(CourseSchema),
    defaultValues: { title: "", type: "BARBER_PRO", description: "", imageUrl: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
        if (editingId) return api.patch(`/courses/${editingId}`, data);
        return api.post("/courses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setIsOpen(false);
      setEditingId(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/courses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });

  const handleEdit = (course: any) => {
      setEditingId(course.id);
      form.reset({
          title: course.title,
          type: course.type,
          description: course.description || "",
          imageUrl: course.imageUrl || "",
      });
      setIsOpen(true);
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Gestión de Cursos</h1>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) { setEditingId(null); form.reset(); } }}>
          <DialogTrigger asChild>
            <Button className="bg-[#25D366] text-black hover:bg-[#1fb554]">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Curso" : "Nuevo Curso"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl><Input {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                         <FormControl>
                           <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Tipo" /></SelectTrigger>
                         </FormControl>
                         <SelectContent className="bg-zinc-900 border-zinc-800">
                             <SelectItem value="BARBER_PRO">Barber Pro</SelectItem>
                             <SelectItem value="UNAS_PRO">Uñas Pro</SelectItem>
                             <SelectItem value="ONLINE">Online</SelectItem>
                             <SelectItem value="SEMINARIO">Seminario</SelectItem>
                         </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl><Textarea {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imagen URL</FormLabel>
                      <FormControl><Input {...field} placeholder="https://..." className="bg-zinc-900 border-zinc-800" /></FormControl>
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
      </div>

      <div className="rounded-md border border-zinc-800">
          <Table>
              <TableHeader className="bg-zinc-900">
                  <TableRow className="border-zinc-800 hover:bg-zinc-900">
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cohortes</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {isLoading ? <TableRow><TableCell colSpan={4} className="text-center">Cargando...</TableCell></TableRow> :
                   courses?.map((course: any) => (
                       <TableRow key={course.id} className="border-zinc-800 hover:bg-zinc-900">
                           <TableCell className="font-medium">{course.title}</TableCell>
                           <TableCell>{course.type}</TableCell>
                           <TableCell>{course._count?.cohorts || 0}</TableCell>
                           <TableCell className="text-right">
                               <Button variant="ghost" size="icon" onClick={() => handleEdit(course)}><Edit className="h-4 w-4 text-blue-500" /></Button>
                               <Button variant="ghost" size="icon" onClick={() => { if(confirm("Eliminar?")) deleteMutation.mutate(course.id) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                           </TableCell>
                       </TableRow>
                   ))}
              </TableBody>
          </Table>
      </div>
    </RoleGuard>
  );
}
