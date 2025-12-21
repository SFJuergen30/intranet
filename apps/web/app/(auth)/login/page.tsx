"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginDto } from '@repo/shared';
import { useAuth } from '@/context/auth-context';
import { useState } from 'react';
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState('');

  const form = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginDto) {
    try {
      await login(data);
    } catch (err) {
      setError('Credenciales inválidas o error de servidor.');
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-zinc-800 bg-black p-10 shadow-xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
            Intranet Login
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Black & White Academy
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Email</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@bwa.com" {...field} className="bg-zinc-900 border-zinc-800 text-white" />
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
                  <FormLabel className="text-zinc-300">Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} className="bg-zinc-900 border-zinc-800 text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full bg-[#25D366] hover:bg-[#1fb554] text-black font-bold">
              Ingresar
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
