"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SidebarContent } from "./sidebar";
import { AnimatePresence, motion } from "framer-motion";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-zinc-400 hover:text-white md:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/80 md:hidden backdrop-blur-sm"
            />

            {/* Sidebar Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 w-[80%] max-w-xs border-r border-zinc-800 bg-zinc-950 p-4 shadow-2xl md:hidden flex flex-col justify-between"
            >
              <div className="absolute right-4 top-4 z-50">
                 <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">
                    <X className="h-6 w-6" />
                 </button>
              </div>
              
              <div className="flex h-full flex-col justify-between pt-8">
                 <SidebarContent onNavigate={() => setIsOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
