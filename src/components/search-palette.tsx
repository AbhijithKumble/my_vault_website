"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FolderGit2,
  CalendarDays,
  FlaskConical,
  Bug,
  Scale,
  Terminal,
  BookOpen,
  X,
  ArrowRight,
} from "lucide-react";

interface SearchResultItem {
  entity_type: string;
  entity_id: string;
  title: string;
  content: string;
  tags: string[];
  url: string;
  badge: string;
}

const entityIcons: Record<string, any> = {
  project: FolderGit2,
  daily_log: CalendarDays,
  experiment: FlaskConical,
  bug: Bug,
  decision: Scale,
  command: Terminal,
  note: BookOpen,
};

const badgeColors: Record<string, string> = {
  project: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  daily_log: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  experiment: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  bug: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  decision: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  command: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  note: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
};

export function SearchPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          setResults(data.results || []);
          setSelectedIndex(0);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < results.length ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      router.push(results[selectedIndex].url);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-start justify-center pt-20 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0e141f] border border-[#243347] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#1e293b] gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, logs, commands, bugs, experiments, notes..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1c2738] border border-[#30425c] text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#1e293b]/50">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              Searching SQLite FTS5 index...
            </div>
          ) : query && results.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-slate-400 text-sm font-medium">No results found</div>
              <div className="text-slate-500 text-xs mt-1">
                Try searching for keywords like &quot;kernel&quot;, &quot;ssh&quot;, &quot;uart&quot;, or &quot;gazebo&quot;
              </div>
            </div>
          ) : results.length > 0 ? (
            results.map((item, idx) => {
              const Icon = entityIcons[item.entity_type] || FolderGit2;
              const isSelected = idx === selectedIndex;
              const badgeClass =
                badgeColors[item.entity_type] ||
                "bg-slate-500/10 text-slate-400 border-slate-500/30";

              return (
                <div
                  key={`${item.entity_type}-${item.entity_id}`}
                  onClick={() => {
                    router.push(item.url);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors flex items-start gap-3 ${
                    isSelected ? "bg-[#182333]" : "hover:bg-[#121924]"
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-md bg-[#1c2738] text-slate-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-100 truncate">
                        {item.title}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border ${badgeClass}`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {item.content}
                    </p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#131b26] text-slate-400 border border-[#243347]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 text-slate-500 mt-2 shrink-0 ${
                      isSelected ? "text-emerald-400 translate-x-0.5" : "opacity-0"
                    } transition-all`}
                  />
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">
              Type anything to search across your entire engineering knowledge base.
            </div>
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-4 py-2 bg-[#090d16] border-t border-[#1e293b] flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Navigate: ↑ ↓</span>
          <span>Open: Enter</span>
          <span>Dismiss: Esc</span>
        </div>
      </div>
    </div>
  );
}
