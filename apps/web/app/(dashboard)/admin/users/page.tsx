"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { RegisterDto, RegisterSchema } from "@repo/shared";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { RoleGuard } from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

async function fetchUsers() {
  const { data } = await api.get("/users");
  return data;
}

async function createUser(newUser: RegisterDto) {
  const { data } = await api.post("/users", newUser);
  return data;
}

async function deleteUser(id: string) {
  const { data } = await api.delete(`/users/${id}`);
  return data;
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsOpen(false);
      form.reset();
    },
    onError: (error) => {
      alert("Error creating user: " + ((error as any).response?.data?.message || (error as any).message));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      alert("Error deleting user: " + ((error as any).response?.data?.message || (error as any).message));
    }
  });

  const form = useForm<RegisterDto>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      role: "STUDENT",
    },
  });

  const onSubmit = (data: RegisterDto) => {
    mutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#25D366] text-black hover:bg-[#1fb554]">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>Crear Usuario</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan Perez" {...field} className="bg-zinc-900 border-zinc-800" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="juan@example.com" {...field} className="bg-zinc-900 border-zinc-800" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} className="bg-zinc-900 border-zinc-800" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-zinc-900 border-zinc-800">
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="STUDENT">Estudiante</SelectItem>
                          <SelectItem value="TEACHER">Profesor</SelectItem>
                          <SelectItem value="ADMIN">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-[#25D366] text-black hover:bg-[#1fb554]">
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
              <TableHead className="text-zinc-400">Nombre</TableHead>
              <TableHead className="text-zinc-400">Email</TableHead>
              <TableHead className="text-zinc-400">Rol</TableHead>
              <TableHead className="text-zinc-400">Estado</TableHead>
              <TableHead className="text-zinc-400 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={5} className="text-center h-24">Cargando...</TableCell>
               </TableRow>
            ) : users?.map((user: any) => (
              <TableRow key={user.id} className="border-zinc-800 hover:bg-zinc-900">
                <TableCell className="font-medium">{user.fullName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    user.role === 'ADMIN' ? 'bg-red-900 text-red-200' :
                    user.role === 'TEACHER' ? 'bg-blue-900 text-blue-200' :
                    'bg-green-900 text-green-200'
                  }`}>
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>
                    {user.isActive ? <span className="text-green-500">Activado</span> : <span className="text-red-500">Desactivado</span>}
                </TableCell>
                <TableCell className="text-right">
                   <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(user.id)}
                      className="text-red-500 hover:text-red-400 hover:bg-red-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                   </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </RoleGuard>
  );
}
