"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Loader2, BookOpen, Clock, MapPin, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function StudentDashboard() {
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: async () => (await api.get("/enrollments/my-enrollments")).data,
  });

  if (isLoading) {
      return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-[#25D366]" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mis Cursos Activos</h1>
        <p className="text-zinc-400">Bienvenido a tu panel estudiantil.</p>
      </div>

      {enrollments?.length === 0 ? (
          <div className="p-8 border border-zinc-800 rounded-xl bg-zinc-900 text-center">
              <h3 className="text-xl font-bold mb-2">No tienes cursos activos</h3>
              <p className="text-zinc-400 mb-4">Explora nuestros programas disponibles.</p>
              <Link href="/student/courses">
                <Button className="bg-[#25D366] text-black">Ver Programas</Button>
              </Link>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments?.map((e: any) => (
                  <div key={e.id} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden hover:border-[#25D366]/50 transition-colors">
                      <div className="h-32 bg-zinc-900 relative">
                          {e.cohort.course.imageUrl ? (
                              <img src={e.cohort.course.imageUrl} alt={e.cohort.course.title} className="w-full h-full object-cover" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                  <BookOpen className="h-12 w-12" />
                              </div>
                          )}
                          <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-bold text-[#25D366] border border-[#25D366]/30">
                              {e.status}
                          </div>
                      </div>
                      <div className="p-6">
                          <h3 className="text-xl font-bold mb-1">{e.cohort.course.title}</h3>
                          <div className="text-sm text-zinc-400 mb-4">{e.cohort.name}</div>
                          
                          <div className="space-y-2 text-sm text-zinc-300 mb-6">
                              <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-[#25D366]" />
                                  <span>{e.cohort.schedule}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-[#25D366]" />
                                  <span>{e.cohort.campus.name}</span>
                              </div>
                          </div>

                          <div className="flex gap-2">
                              <Link href={`/student/grades?course=${e.id}`} className="flex-1">
                                <Button variant="outline" className="w-full border-zinc-800 hover:bg-zinc-900">
                                    <Award className="mr-2 h-4 w-4" /> Notas
                                </Button>
                              </Link>
                              <Link href={`/student/schedule`} className="flex-1">
                                <Button className="w-full bg-[#25D366] text-black hover:bg-[#1fb554]">
                                    Ver Horario
                                </Button>
                              </Link>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
}
