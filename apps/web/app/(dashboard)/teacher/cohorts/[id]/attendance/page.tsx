"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Loader2, Save, CheckSquare } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function TeacherAttendancePage() {
  const params = useParams()
  const cohortId = params.id as string
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]) // YYYY-MM-DD
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // 1. Fetch Attendance (which includes enrollment/student info)
  // The backend endpoint findByCohort returns existing attendance records.
  // BUT we also need the list of ALL students in the cohort to mark them.
  // The current findByCohort endpoint returns `Attendance[]` with included `enrollment.student`.
  // If a student has NO attendance for this date, they won't show up?
  // Let's check logic:
  // Usually, we fetch Enrollments for the cohort first, then map attendance to them.
  // OR the backend endpoint should return a "Sheet" object.
  // For MVP, I'll fetch Enrollments AND Attendance.
  // Wait, I implemented findByCohort in AttendanceService. It returns `Attendance[]`.
  // If I query for a specific date, it returns only existing records.
  // So I need to fetch Enrollments to get the full class list.
  
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
      queryKey: ["cohort-enrollments", cohortId],
      queryFn: async () => {
          const res = await api.get(`/enrollments/cohort/${cohortId}`)
          return res.data
      }
  })

  const { data: attendanceRecords, isLoading: loadingAttendance } = useQuery({
      queryKey: ["cohort-attendance", cohortId, date],
      queryFn: async () => {
          const res = await api.get(`/attendance/cohort/${cohortId}?date=${date}`)
          return res.data
      }
  })

  // State for checkboxes
  const [attendanceState, setAttendanceState] = useState<Record<string, boolean>>({})
  
  // Initialize state when data loads
  const attendanceMap = new Map()
  attendanceRecords?.forEach((r: any) => attendanceMap.set(r.enrollmentId, r.isPresent))

  // Derived students list
  const students = enrollments?.map((e: any) => ({
      enrollmentId: e.id,
      name: e.student.user.fullName,
      email: e.student.user.email,
  })) || []

  const { mutate: saveAttendance, isLoading: isSaving } = useMutation({
      mutationFn: async (items: any[]) => {
          return api.post("/attendance/batch", {
              cohortId, 
              date: new Date(date),
              items
          })
      },
      onSuccess: () => {
          toast({ title: "Asistencia guardada" })
          queryClient.invalidateQueries(["cohort-attendance", cohortId, date])
      },
      onError: () => {
           toast({ title: "Error al guardar", variant: "destructive" })
      }
  })

  // Handle individual check
  const handleCheck = (enrollmentId: string, checked: boolean) => {
      setAttendanceState(prev => ({ ...prev, [enrollmentId]: checked }))
  }

  // "Mark All" helper
  const markAll = () => {
     const newState = {}
     students.forEach((s: any) => newState[s.enrollmentId] = true)
     setAttendanceState(newState)
  }

  const handleSave = () => {
      // Build payload from state, falling back to existing records if state is undefined
      // If state is undefined, it means user didn't touch it. 
      // Should we use the initial value? Yes.
      
      const items = students.map((s: any) => {
           // Current value in UI:
           // If in state -> use state
           // If not in state -> use fetched existing value (attendanceMap)
           // If neither -> default false? Or default true if envisioned as "Mark All"?
           // Let's default to FALSE if no record exists.
           
           const initialVal = attendanceMap.has(s.enrollmentId) ? attendanceMap.get(s.enrollmentId) : false
           const currentVal = attendanceState[s.enrollmentId] ?? initialVal
           
           return {
               enrollmentId: s.enrollmentId,
               isPresent: currentVal,
               notes: ""
           }
      })
      
      saveAttendance(items)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Control de Asistencia</h1>
          <p className="text-muted-foreground">
            Registrar asistencia para el dia
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="w-40 bg-zinc-900 border-zinc-700"
            />
        </div>
      </div>

      <Card className="border-gold-500/20 bg-zinc-950">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Listado de Alumnos</CardTitle>
             <Button variant="outline" size="sm" onClick={markAll} className="gap-2">
                <CheckSquare className="h-4 w-4" /> Marcar Todos
             </Button>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {students.map((student: any) => {
                    // Determine checked state
                    const initialVal = attendanceMap.has(student.enrollmentId) ? attendanceMap.get(student.enrollmentId) : false
                    const isChecked = attendanceState[student.enrollmentId] ?? initialVal
                    
                    return (
                    <div key={student.enrollmentId} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
                        <div className="flex flex-col">
                            <span className="font-medium text-white">{student.name}</span>
                            <span className="text-xs text-muted-foreground">{student.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={isChecked ? "text-green-500 text-sm mr-2" : "text-zinc-500 text-sm mr-2"}>
                                {isChecked ? "Presente" : "Ausente"}
                            </span>
                            <Checkbox 
                                id={student.enrollmentId} 
                                checked={isChecked}
                                onCheckedChange={(checked) => handleCheck(student.enrollmentId, checked as boolean)}
                                className="border-white/50 data-[state=checked]:bg-gold-500 data-[state=checked]:text-black"
                            />
                        </div>
                    </div>
                )})}
                {students.length === 0 && <p className="text-center text-muted-foreground">No hay alumnos matriculados.</p>}
            </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="bg-gold-500 text-black hover:bg-gold-400 gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar Asistencia
          </Button>
      </div>
    </div>
  )
}
