"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CalendarDays,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  FolderGit2,
  Trash2,
  Edit3,
  Save,
  X,
} from "lucide-react";

interface DailyLog {
  id: string;
  date: string;
  project_ids: string[];
  projects: Array<{ id: string; name: string; slug: string }>;
  today_goal: string;
  what_did: string;
  what_learned: string;
  blockers: string;
  tomorrow_plan: string;
  notes: string;
  created_at: string;
}

export default function DailyLogsPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editGoal, setEditGoal] = useState("");
  const [editWhatDid, setEditWhatDid] = useState("");
  const [editWhatLearned, setEditWhatLearned] = useState("");
  const [editBlockers, setEditBlockers] = useState("");
  const [editTomorrowPlan, setEditTomorrowPlan] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = (log: DailyLog) => {
    setEditGoal(log.today_goal || "");
    setEditWhatDid(log.what_did || "");
    setEditWhatLearned(log.what_learned || "");
    setEditBlockers(log.blockers || "");
    setEditTomorrowPlan(log.tomorrow_plan || "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEditing = async () => {
    if (!selectedLog) return;
    setIsSaving(true);
    try {
      await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedLog.date,
          project_ids: selectedLog.project_ids,
          today_goal: editGoal,
          what_did: editWhatDid,
          what_learned: editWhatLearned,
          blockers: editBlockers,
          tomorrow_plan: editTomorrowPlan,
          notes: selectedLog.notes,
        }),
      });

      const updated = {
        ...selectedLog,
        today_goal: editGoal,
        what_did: editWhatDid,
        what_learned: editWhatLearned,
        blockers: editBlockers,
        tomorrow_plan: editTomorrowPlan,
      };
      setSelectedLog(updated);
      setIsEditing(false);
      fetchLogs();
    } catch (err) {
      console.error("Failed to save daily log edits:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchLogs = useCallback(() => {
    fetch("/api/daily")
      .then((res) => res.json())
      .then((data) => {
        const list = data.logs || [];
        setLogs(list);
        if (list.length > 0) {
          setSelectedLog(list[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((l) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      l.date.includes(term) ||
      l.today_goal?.toLowerCase().includes(term) ||
      l.what_did?.toLowerCase().includes(term) ||
      l.what_learned?.toLowerCase().includes(term) ||
      l.blockers?.toLowerCase().includes(term)
    );
  });

  const exportCurrentLogMarkdown = () => {
    if (!selectedLog) return;
    const md = `# Engineering Log - ${selectedLog.date}

## Projects Worked On
${selectedLog.projects?.map((p) => `- ${p.name}`).join("\n") || "None specified"}

## Today's Goal
${selectedLog.today_goal || "N/A"}

## What I Did
${selectedLog.what_did || "N/A"}

## What I Learned
${selectedLog.what_learned || "N/A"}

## Blockers / Problems
${selectedLog.blockers || "None"}

## Tomorrow
${selectedLog.tomorrow_plan || "N/A"}
`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `engineering-log-${selectedLog.date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteLog = async (id: string, date: string) => {
    if (!confirm(`Are you sure you want to delete the daily log for ${date}?`)) return;
    await fetch(`/api/daily?id=${id}`, { method: "DELETE" });
    setSelectedLog(null);
    fetchLogs();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-semibold tracking-wider uppercase">
            <CalendarDays className="w-4 h-4" />
            <span>DAILY LOG ARCHIVE</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 font-mono mt-1">
            Historical Engineering Records
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCurrentLogMarkdown}
            disabled={!selectedLog}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#131b26] hover:bg-[#1c2738] text-slate-200 border border-[#243347] text-xs font-mono transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Day to .MD</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar list + Detail view */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Logs Timeline List */}
        <div className="space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter logs by keyword or date..."
              className="w-full pl-9 pr-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-4 text-xs font-mono text-slate-500 text-center">
                Loading logs...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-4 text-xs text-slate-500 text-center">
                No logs found matching filter.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => {
                      setSelectedLog(log);
                      setIsEditing(false);
                    }}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#182333] border-emerald-500/40"
                        : "bg-[#0e141f] border-[#1e293b] hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {log.date}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {log.projects?.length || 0} project(s)
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {log.today_goal || log.what_did || "Log entry"}
                    </p>
                    {log.projects && log.projects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {log.projects.map((p) => (
                          <span
                            key={p.id}
                            className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#131b26] text-emerald-400/90 border border-[#243347]"
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Log Detail */}
        <div className="md:col-span-2">
          {selectedLog ? (
            <div className="p-6 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-6">
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
                <div>
                  <h2 className="text-lg font-bold font-mono text-slate-100">
                    Log: {selectedLog.date}
                  </h2>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedLog.projects?.map((p) => (
                      <span
                        key={p.id}
                        className="text-xs font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                      >
                        <FolderGit2 className="w-3 h-3" />
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={cancelEditing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#131b26] hover:bg-[#1c2738] text-slate-300 border border-[#243347] text-xs font-mono transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={saveEditing}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-semibold transition-colors shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(selectedLog)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-mono transition-colors"
                        title="Edit this daily log"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Log</span>
                      </button>
                      <button
                        onClick={() => handleDeleteLog(selectedLog.id, selectedLog.date)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono transition-colors"
                        title="Delete this daily log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Log</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Goal */}
              <div className="space-y-1">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Today&apos;s Goal
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value)}
                    placeholder="Focus for this day..."
                    className="w-full px-3.5 py-2 rounded-lg bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                  />
                ) : (
                  <div className="p-3 rounded-lg bg-[#131b26] border border-[#243347] text-xs text-slate-200">
                    {selectedLog.today_goal || "No goal specified"}
                  </div>
                )}
              </div>

              {/* What was done */}
              <div className="space-y-1">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  What Did I Actually Do?
                </div>
                {isEditing ? (
                  <textarea
                    rows={4}
                    value={editWhatDid}
                    onChange={(e) => setEditWhatDid(e.target.value)}
                    placeholder="Commands executed, commits made, breadboards wired..."
                    className="w-full p-3.5 rounded-lg bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 font-mono leading-relaxed focus:outline-hidden focus:border-blue-500"
                  />
                ) : (
                  <div className="p-3.5 rounded-lg bg-[#131b26] border border-[#243347] text-xs text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
                    {selectedLog.what_did || "No activity recorded"}
                  </div>
                )}
              </div>

              {/* Grid: Learned & Blockers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" /> What Did I Learn?
                  </div>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={editWhatLearned}
                      onChange={(e) => setEditWhatLearned(e.target.value)}
                      placeholder="Insights, kernel flags, hardware behaviors..."
                      className="w-full p-3.5 rounded-lg bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 font-mono leading-relaxed focus:outline-hidden focus:border-emerald-500"
                    />
                  ) : (
                    <div className="p-3.5 rounded-lg bg-[#131b26] border border-[#243347] text-xs text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
                      {selectedLog.what_learned || "No notes"}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-mono uppercase tracking-wider text-rose-400 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> What Was Blocking Me?
                  </div>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={editBlockers}
                      onChange={(e) => setEditBlockers(e.target.value)}
                      placeholder="Missing parts, cryptic compile error, voltage drops..."
                      className="w-full p-3.5 rounded-lg bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 font-mono leading-relaxed focus:outline-hidden focus:border-rose-500"
                    />
                  ) : (
                    <div className="p-3.5 rounded-lg bg-[#131b26] border border-[#243347] text-xs text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
                      {selectedLog.blockers || "No blockers recorded"}
                    </div>
                  )}
                </div>
              </div>

              {/* Tomorrow */}
              <div className="space-y-1">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-400" /> Tomorrow&apos;s Plan
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editTomorrowPlan}
                    onChange={(e) => setEditTomorrowPlan(e.target.value)}
                    placeholder="Next smallest step for tomorrow..."
                    className="w-full px-3.5 py-2 rounded-lg bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                  />
                ) : (
                  <div className="p-3 rounded-lg bg-[#131b26] border border-[#243347] text-xs text-slate-200">
                    {selectedLog.tomorrow_plan || "No next step scheduled"}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 font-mono">
              Select a date to view historical log.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
