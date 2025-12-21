"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, Video, Link as LinkIcon, Download } from "lucide-react"

export default function StudentResourcesPage() {
  const [filter, setFilter] = useState<'ALL' | 'PDF' | 'VIDEO' | 'LINK'>('ALL')

  // 1. Fetch Enrollment to get Cohort ID
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
      queryKey: ["my-enrollments"],
      queryFn: async () => {
          const res = await api.get("/enrollments/my-enrollments")
          return res.data
      }
  })

  const activeEnrollment = enrollments?.[0]
  const cohortId = activeEnrollment?.cohortId

  // 2. Fetch Materials
  const { data: materials, isLoading: loadingMaterials } = useQuery({
      queryKey: ["materials", cohortId],
      queryFn: async () => {
          const res = await api.get(`/materials/cohort/${cohortId}`)
          return res.data
      },
      enabled: !!cohortId
  })

  if (loadingEnrollments || (cohortId && loadingMaterials)) {
      return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!activeEnrollment) {
      return <div className="p-8 text-center">No active enrollment found.</div>
  }

  const filteredMaterials = (materials || []).filter((m: any) => 
      filter === 'ALL' ? true : m.type === filter
  )

  const getIcon = (type: string) => {
      switch (type) {
          case 'PDF': return <FileText className="h-5 w-5 text-red-500" />
          case 'VIDEO': return <Video className="h-5 w-5 text-blue-500" />
          case 'LINK': return <LinkIcon className="h-5 w-5 text-green-500" />
          default: return <FileText className="h-5 w-5" />
      }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gold-500">Recursos de Clase</h1>
        <p className="text-muted-foreground">
          Materiales educativos para tu cohorte
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
          <Button variant={filter === 'ALL' ? "default" : "outline"} onClick={() => setFilter('ALL')}>Todos</Button>
          <Button variant={filter === 'PDF' ? "default" : "outline"} onClick={() => setFilter('PDF')} className="gap-2">
              <FileText className="h-4 w-4" /> Documentos
          </Button>
          <Button variant={filter === 'VIDEO' ? "default" : "outline"} onClick={() => setFilter('VIDEO')} className="gap-2">
              <Video className="h-4 w-4" /> Videos
          </Button>
          <Button variant={filter === 'LINK' ? "default" : "outline"} onClick={() => setFilter('LINK')} className="gap-2">
              <LinkIcon className="h-4 w-4" /> Enlaces
          </Button>
      </div>

      {/* List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                  No hay materiales disponibles con este filtro.
              </div>
          ) : (
              filteredMaterials.map((material: any) => (
                  <Card key={material.id} className="hover:border-gold-500 transition-colors">
                      <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                  {getIcon(material.type)}
                                  <Badge variant="outline">{material.type}</Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                  {new Date(material.createdAt).toLocaleDateString()}
                              </span>
                          </div>
                      </CardHeader>
                      <CardContent>
                          <CardTitle className="text-lg mb-2">{material.title}</CardTitle>
                          <Button asChild size="sm" className="w-full mt-4 bg-zinc-900 text-gold-500 hover:bg-zinc-800">
                              <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                                  <Download className="h-4 w-4" /> Abrir Recurso
                              </a>
                          </Button>
                      </CardContent>
                  </Card>
              ))
          )}
      </div>
    </div>
  )
}
