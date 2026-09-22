"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { SearchPalette } from "@/components/search-palette";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100">
      <Sidebar onOpenSearch={() => setIsSearchOpen(true)} />
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
      <SearchPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
