import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-black flex-col md:flex-row">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
             <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-xs">BW</span>
             </div>
             <span className="font-bold text-white">Intranet</span>
          </div>
          <MobileNav />
      </div>

      <main className="flex-1 overflow-y-auto bg-zinc-950 p-4 md:p-8 text-white">
        {children}
      </main>
    </div>
  );
}
