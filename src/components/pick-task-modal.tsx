"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Clock, CheckCircle2, AlertCircle, ArrowRight, X } from "lucide-react";

interface PickedTask {
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  projectSlug: string;
  priority: number;
  isNextAction: boolean;
  estimatedMinutes: number;
  daysUntouched: number;
  totalScore: number;
  reasons: string[];
}

interface PickTaskResponse {
  chosenTask: PickedTask | null;
  runnersUp: PickedTask[];
  totalEvaluated: number;
  availableMinutes: number;
  message?: string;
}

export function PickTaskModal({
  isOpen,
  onClose,
  onAcceptTask,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAcceptTask: (task: PickedTask) => void;
}) {
  const [minutes, setMinutes] = useState<number>(60);
  const [data, setData] = useState<PickTaskResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPick = useCallback(async (timeLimit: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/cockpit/pick-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availableMinutes: timeLimit }),
      });
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPick(minutes);
    }
  }, [isOpen, minutes, fetchPick]);

  if (!isOpen) return null;

  const chosen = data?.chosenTask;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#0e141f] border border-[#243347] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-mono tracking-wide">
                DETERMINISTIC TASK PICKER
              </h2>
              <p className="text-[11px] text-slate-400">
                Algorithm-based selection: priority · staleness · available time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Time Budget Selector */}
        <div className="px-5 py-3 bg-[#131b26] border-b border-[#1e293b] flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Available Time:
          </span>
          <div className="flex gap-1.5">
            {[30, 45, 60, 90, 120].map((t) => (
              <button
                key={t}
                onClick={() => setMinutes(t)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  minutes === t
                    ? "bg-amber-500 text-black font-bold shadow-xs"
                    : "bg-[#1c2738] text-slate-300 hover:bg-[#243347]"
                }`}
              >
                {t}m
              </button>
            ))}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-slate-500">
              Evaluating candidate tasks across active projects...
            </div>
          ) : chosen ? (
            <>
              {/* Primary Pick Card */}
              <div className="p-4 rounded-lg bg-[#151f2e] border border-amber-500/40 relative">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                    {chosen.projectName}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      ~{chosen.estimatedMinutes}m
                    </span>
                    <span className="text-amber-400 font-bold">
                      Score: {chosen.totalScore}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-slate-100 mt-2">
                  {chosen.taskTitle}
                </h3>

                {/* Algorithmic Rationale */}
                <div className="mt-3 pt-3 border-t border-[#243347] space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Why this was chosen:
                  </div>
                  <ul className="space-y-1">
                    {chosen.reasons.map((r, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-300 flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      onAcceptTask(chosen);
                      onClose();
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                  >
                    <span>Accept As Today&apos;s Focus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Runners Up Section */}
              {data && data.runnersUp && data.runnersUp.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                    Alternative Candidates
                  </div>
                  <div className="space-y-2">
                    {data.runnersUp.map((runner) => (
                      <div
                        key={runner.taskId}
                        className="p-3 rounded-lg bg-[#111722] border border-[#1e293b] flex items-center justify-between gap-3 hover:border-slate-600 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-400">
                              {runner.projectName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ~{runner.estimatedMinutes}m
                            </span>
                          </div>
                          <div className="text-xs text-slate-200 font-medium truncate mt-0.5">
                            {runner.taskTitle}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            onAcceptTask(runner);
                            onClose();
                          }}
                          className="text-xs text-amber-400 hover:text-amber-300 font-mono shrink-0 px-2 py-1 rounded bg-[#1c2738] hover:bg-[#243347]"
                        >
                          Select
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="text-sm text-slate-300 font-medium">
                {data?.message || "No tasks available to pick."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
