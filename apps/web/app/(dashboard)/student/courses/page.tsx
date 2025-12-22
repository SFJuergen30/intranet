"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudentCoursesList() {
  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses-public"],
    queryFn: async () => (await api.get("/courses")).data,
  });

  if (isLoading) {
      return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-[#25D366]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
            <BookOpen className="h-6 w-6 text-[#25D366]" />
        </div>
        <div>
            <h1 className="text-2xl font-bold">Programas Disponibles</h1>
            <p className="text-zinc-400">Descubre nuestros cursos y niveles.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.map((course: any) => (
             <div key={course.id} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden hover:border-[#25D366]/50 transition-colors group">
                 {course.imageUrl && (
                     <div className="h-48 w-full bg-zinc-900 relative">
                         <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                     </div>
                 )}
                 <div className="p-6">
                     <span className="text-xs font-bold px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[#25D366] mb-3 inline-block">
                        {course.type.replace('_', ' ')}
                     </span>
                     <h3 className="text-xl font-bold mb-2 group-hover:text-[#25D366] transition-colors">{course.title}</h3>
                     <p className="text-zinc-400 text-sm mb-4 line-clamp-3">
                        {course.description || "Sin descripción disponible."}
                     </p>
                     <Button className="w-full bg-white text-black hover:bg-zinc-200">
                        Ver Detalles
                     </Button>
                 </div>
             </div>
          ))}
      </div>
    </div>
  );
}
