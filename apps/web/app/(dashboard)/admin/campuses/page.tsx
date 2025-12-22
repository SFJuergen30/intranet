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
import { Plus, Trash2, Edit, MapPin } from "lucide-react";

const CampusSchema = z.object({
  name: z.string().min(3),
  address: z.string().optional(),
});

type CampusFormValues = z.infer<typeof CampusSchema>;

export default function AdminCampusesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: campuses, isLoading } = useQuery({
    queryKey: ["campuses"],
    queryFn: async () => (await api.get("/campuses")).data,
  });

  const form = useForm<CampusFormValues>({
    resolver: zodResolver(CampusSchema),
    defaultValues: { name: "", address: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: CampusFormValues) => {
        if (editingId) return api.patch(`/campuses/${editingId}`, data);
        return api.post("/campuses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campuses"] });
      setIsOpen(false);
      setEditingId(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/campuses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campuses"] }),
  });

  const handleEdit = (campus: any) => {
      setEditingId(campus.id);
      form.reset({
          name: campus.name,
          address: campus.address || "",
      });
      setIsOpen(true);
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Gestión de Sedes</h1>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) { setEditingId(null); form.reset(); } }}>
          <DialogTrigger asChild>
            <Button className="bg-[#25D366] text-black hover:bg-[#1fb554]">
              <Plus className="mr-2 h-4 w-4" /> Nueva Sede
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Sede" : "Nueva Sede"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre (ej. Sede Arequipa)</FormLabel>
                      <FormControl><Input {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
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
      </div>

      <div className="rounded-md border border-zinc-800">
          <Table>
              <TableHeader className="bg-zinc-900">
                  <TableRow className="border-zinc-800 hover:bg-zinc-900">
                      <TableHead>Nombre</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {isLoading ? <TableRow><TableCell colSpan={3} className="text-center">Cargando...</TableCell></TableRow> :
                   campuses?.map((campus: any) => (
                       <TableRow key={campus.id} className="border-zinc-800 hover:bg-zinc-900">
                           <TableCell className="font-medium flex items-center gap-2">
                               <MapPin className="h-4 w-4 text-[#25D366]" />
                               {campus.name}
                           </TableCell>
                           <TableCell>{campus.address}</TableCell>
                           <TableCell className="text-right">
                               <Button variant="ghost" size="icon" onClick={() => handleEdit(campus)}><Edit className="h-4 w-4 text-blue-500" /></Button>
                               <Button variant="ghost" size="icon" onClick={() => { if(confirm("Eliminar?")) deleteMutation.mutate(campus.id) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                           </TableCell>
                       </TableRow>
                   ))}
              </TableBody>
          </Table>
      </div>
    </RoleGuard>
  );
}
