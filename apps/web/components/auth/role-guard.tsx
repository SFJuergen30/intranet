"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('ADMIN' | 'TEACHER' | 'STUDENT')[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && user && !allowedRoles.includes(user.role)) {
      // Redirect to their default dashboard if authorized but wrong role
      if (user.role === 'ADMIN') router.push('/admin');
      else if (user.role === 'TEACHER') router.push('/teacher');
      else router.push('/student');
    }
  }, [user, isLoading, router, allowedRoles]);

  if (isLoading || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-[#25D366]" />
      </div>
      </div>
    );
  }

  return <>{children}</>;
}
