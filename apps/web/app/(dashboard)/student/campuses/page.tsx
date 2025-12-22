"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Loader2, MapPin } from "lucide-react";

export default function StudentCampusesList() {
  const { data: campuses, isLoading } = useQuery({
    queryKey: ["campuses-public"],
    queryFn: async () => (await api.get("/campuses")).data,
  });

  if (isLoading) {
      return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-[#25D366]" /></div>;
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
        <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
            <MapPin className="h-6 w-6 text-[#25D366]" />
        </div>
        <div>
            <h1 className="text-2xl font-bold">Nuestras Sedes</h1>
            <p className="text-zinc-400">Ubica tu sede más cercana.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campuses?.map((campus: any) => (
             <div key={campus.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 hover:border-[#25D366]/50 transition-colors">
                 <div className="h-12 w-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-[#25D366]">
                     <MapPin className="h-6 w-6" />
                 </div>
                 <h3 className="text-xl font-bold mb-2">{campus.name}</h3>
                 <p className="text-zinc-400 text-sm mb-4">
                    {campus.address || "Dirección no especificada."}
                 </p>
                 <div className="w-full h-32 bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                     Mapa próximamente
                 </div>
             </div>
          ))}
      </div>
    </div>
  );
}
