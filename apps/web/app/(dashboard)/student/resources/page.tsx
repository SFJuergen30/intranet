"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Loader2, Library, FileText, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudentResourcesPage() {
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

  // Handle resourceLinks parsing if it comes as string or object
  let resources = profile?.resourceLinks || [];
  if (typeof resources === 'string') {
      try {
          resources = JSON.parse(resources);
      } catch (e) {
          resources = [];
      }
  }

  // Ensure it is an array
  if (!Array.isArray(resources)) resources = [];

  // Filter out empty entries
  resources = resources.filter((r: any) => r.name && r.url);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
         <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
            <Library className="h-6 w-6 text-[#25D366]" />
        </div>
        <div>
            <h1 className="text-2xl font-bold">Recursos Académicos</h1>
            <p className="text-zinc-400">Descarga tus materiales de estudio.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.length > 0 ? (
            resources.map((resource: any, idx: number) => (
                <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-[#25D366]/50 transition-colors group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-zinc-950 rounded-lg">
                            <FileText className="h-6 w-6 text-[#25D366]" />
                        </div>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-[#25D366] transition-colors">{resource.name}</h3>
                    <p className="text-sm text-zinc-500 mb-4 line-clamp-2">Recurso descargable</p>
                    
                    <Button 
                        variant="outline" 
                        className="w-full border-zinc-700 hover:bg-[#25D366] hover:text-black hover:border-[#25D366]"
                        onClick={() => window.open(resource.url, '_blank')}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Descargar
                    </Button>
                </div>
            ))
        ) : (
             <div className="col-span-full py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                <Library className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay recursos asignados todavía.</p>
            </div>
        )}
      </div>
    </div>
  );
}
