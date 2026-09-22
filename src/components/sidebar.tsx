"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  FolderGit2,
  FlaskConical,
  BookOpen,
  Terminal,
  Bug,
  Scale,
  Lightbulb,
  Cpu,
  Search,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ProjectLink {
  id: string;
  slug: string;
  name: string;
  status: string;
}

export function Sidebar({ onOpenSearch }: { onOpenSearch?: () => void }) {
  const pathname = usePathname();
  const [activeProjects, setActiveProjects] = useState<ProjectLink[]>([]);

  useEffect(() => {
    fetch("/api/projects?status=active")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) {
          setActiveProjects(data.projects);
        }
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { href: "/", label: "Today's Cockpit", icon: LayoutDashboard },
    { href: "/daily", label: "Daily Log", icon: CalendarDays },
    { href: "/projects", label: "Projects Lab", icon: FolderGit2 },
    { href: "/experiments", label: "Experiments", icon: FlaskConical },
    { href: "/knowledge", label: "Knowledge Wiki", icon: BookOpen },
    { href: "/commands", label: "Command Vault", icon: Terminal },
    { href: "/bugs", label: "Bug Journal", icon: Bug },
    { href: "/decisions", label: "Decisions", icon: Scale },
    { href: "/ideas", label: "Ideas Inbox", icon: Lightbulb },
    { href: "/hardware", label: "Hardware Lab", icon: Cpu },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#0c1017] border-r border-[#1e293b] flex flex-col h-screen sticky top-0 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="font-mono font-bold text-sm text-slate-100 tracking-wider">
              VAULT_COCKPIT
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              THINK · BUILD · LEARN
            </div>
          </div>
        </Link>
      </div>

      {/* Global Search Button */}
      <div className="p-3">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search vault...</span>
          </span>
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1c2738] border border-[#30425c] text-slate-400">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 py-1">
          Systems
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#131b26]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Active Projects Section */}
        <div className="pt-4">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 py-1">
            <span>Active Projects</span>
            <Link
              href="/projects"
              className="hover:text-slate-300"
              title="Add or manage projects"
            >
              <Plus className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-0.5 mt-1">
            {activeProjects.length === 0 ? (
              <div className="px-2 py-1 text-[11px] text-slate-600 italic">
                No active projects
              </div>
            ) : (
              activeProjects.map((p) => {
                const isActive = pathname === `/projects/${p.slug}`;
                return (
                  <Link
                    key={p.id}
                    href={`/projects/${p.slug}`}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs truncate transition-colors ${
                      isActive
                        ? "bg-[#182333] text-emerald-300 font-medium"
                        : "text-slate-400 hover:text-slate-200 hover:bg-[#131b26]"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-[#1e293b] text-[11px] text-slate-500 flex items-center justify-between font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>FTS5 READY</span>
        </span>
        <span>v0.1.0</span>
      </div>
    </aside>
  );
}
