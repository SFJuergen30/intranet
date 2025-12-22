"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Loader2, Calendar } from "lucide-react";

export default function StudentSchedulePage() {
  const { user } = useAuth();
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: async () => {
        if (!user?.id) return null;
        const { data } = await api.get(`/users/${user.id}`);
        return data.studentProfile;
    },
    enabled: !!user?.id
  });

  if (isLoading) {
      return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-[#25D366]" /></div>;
  }

  const scheduleUrl = profile?.scheduleUrl;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
            <Calendar className="h-6 w-6 text-[#25D366]" />
        </div>
        <div>
            <h1 className="text-2xl font-bold">Mi Horario</h1>
            <p className="text-zinc-400">Consulta tus horarios de clase aquí.</p>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 min-h-[400px] flex items-center justify-center">
        {scheduleUrl ? (
            scheduleUrl.endsWith('.pdf') ? (
                <iframe src={scheduleUrl} className="w-full h-[800px] rounded-lg" />
            ) : (
                <img src={scheduleUrl} alt="Horario" className="max-w-full h-auto rounded-lg shadow-lg" />
            )
        ) : (
            <div className="text-center text-zinc-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No tienes un horario asignado todavía.</p>
            </div>
        )}
      </div>
    </div>
  );
}
