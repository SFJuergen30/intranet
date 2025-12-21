"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Loader2, TrendingUp, BookOpen, Clock } from "lucide-react"

export default function StudentProgressPage() {
  // 1. Fetch Enrollments to pick the active one
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
      queryKey: ["my-enrollments"],
      queryFn: async () => {
          const res = await api.get("/enrollments/my-enrollments")
          return res.data
      }
  })

  // Pick first active enrollment for MVP
  const activeEnrollment = enrollments?.[0]

  // 2. Fetch Progress Stats
  const { data: stats, isLoading: loadingStats, error } = useQuery({
      queryKey: ["student-progress", activeEnrollment?.id],
      queryFn: async () => {
          const res = await api.get(`/enrollments/${activeEnrollment.id}/progress`)
          return res.data
      },
      enabled: !!activeEnrollment
  })

  if (loadingEnrollments || (activeEnrollment && loadingStats)) {
      return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!activeEnrollment) {
      return (
          <div className="p-8 text-center">
              <h2 className="text-xl font-bold">No accounts found</h2>
              <p className="text-muted-foreground">You are not enrolled in any active course.</p>
          </div>
      )
  }

  if (error) {
      return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>Failed to load progress details.</AlertDescription></Alert>
  }

  // Transform for Chart
  const chartData = [
      { name: 'Asistencia', value: stats.attendancePercentage, fill: '#f59e0b' }, // Gold
      { name: 'Promedio Notas', value: (stats.averageGrade / 20) * 100, fill: '#10b981' }, // Green relative to 100%
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gold-500">Mi Progreso</h1>
        <p className="text-muted-foreground">
          Resumen de rendimiento para {activeEnrollment.cohort?.course?.title || 'Curso'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Card: Promedio */}
        <Card className="border-l-4 border-l-gold-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
            <TrendingUp className="h-4 w-4 text-gold-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageGrade} / 20</div>
            <p className="text-xs text-muted-foreground">
              Basado en {stats.details.modulesGraded} módulos calificados
            </p>
          </CardContent>
        </Card>

        {/* Card: Asistencia */}
        <Card className="border-l-4 border-l-gold-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistencia</CardTitle>
            <Clock className="h-4 w-4 text-gold-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendancePercentage}%</div>
            <Progress value={stats.attendancePercentage} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.details.presentClasses} clases asistidas de {stats.details.totalClasses}
            </p>
          </CardContent>
        </Card>

        {/* Card: Estado */}
        <Card className="border-l-4 border-l-gold-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estado Académico</CardTitle>
                <BookOpen className="h-4 w-4 text-gold-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-green-500">Activo</div>
                <p className="text-xs text-muted-foreground">
                    Cohorte: {activeEnrollment.cohort?.name}
                </p>
            </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
              <CardHeader>
                  <CardTitle>Rendimiento Visual</CardTitle>
                  <CardDescription>Comparativa de métricas clave</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <XAxis type="number" domain={[0, 100]} hide />
                          <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                          <Tooltip />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                             {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                             ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>
          
          {/* Recent feedback or details could go here, for now placeholder */}
          <Card className="col-span-1">
              <CardHeader>
                  <CardTitle>Detalles</CardTitle>
                  <CardDescription>Información adicional</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                          <span className="font-medium">Campus</span>
                          <span>{activeEnrollment.cohort?.campus?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between border-b pb-2">
                          <span className="font-medium">Inicio</span>
                          <span>{new Date(activeEnrollment.cohort?.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between border-b pb-2">
                          <span className="font-medium">Horario</span>
                          <span>{activeEnrollment.cohort?.schedule || 'N/A'}</span>
                      </div>
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  )
}
