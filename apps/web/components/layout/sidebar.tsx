"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, BookOpen, GraduationCap, CalendarCheck, LogOut, TrendingUp, Library, CreditCard } from "lucide-react";

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col justify-between border-r border-zinc-800 bg-zinc-950 p-4">
      <SidebarContent />
    </div>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["ADMIN"] },
    { name: "Usuarios", href: "/admin/users", icon: Users, roles: ["ADMIN"] },
    { name: "Cursos", href: "/admin/courses", icon: BookOpen, roles: ["ADMIN"] },
    { name: "Matrícula", href: "/admin/enrollments", icon: CalendarCheck, roles: ["ADMIN"] },
    
    { name: "Mis Grupos", href: "/teacher", icon: Users, roles: ["TEACHER"] },
    { name: "Mis Cursos", href: "/student", icon: BookOpen, roles: ["STUDENT"] },
    { name: "Mis Notas", href: "/student/grades", icon: GraduationCap, roles: ["STUDENT"] },
    { name: "Mi Progreso", href: "/student/progress", icon: TrendingUp, roles: ["STUDENT"] },
    { name: "Recursos", href: "/student/resources", icon: Library, roles: ["STUDENT"] },
    { name: "Horario", href: "/student/schedule", icon: CalendarCheck, roles: ["STUDENT"] },
    { name: "Pagos", href: "/student/payments", icon: CreditCard, roles: ["STUDENT"] },
  ];

  const filteredLinks = links.filter(link => user && link.roles.includes(user.role));

  return (
    <>
      <div>
        <div className="mb-8 flex items-center gap-2 px-2">
           <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-xs">BW</span>
           </div>
           <span className="text-lg font-bold text-white">B&W Intranet</span>
        </div>
        
        <nav className="space-y-1">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-[#25D366] text-black" 
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-zinc-800 pt-4">
        <div className="mb-4 px-2">
            <p className="text-xs text-zinc-500">Logueado como</p>
            <p className="text-sm font-medium text-white truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => {
             logout();
             if (onNavigate) onNavigate();
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-500 hover:bg-zinc-800 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </>
  );
}
