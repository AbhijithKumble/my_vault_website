"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  ExternalLink,
  FlaskConical,
  Bug,
  Scale,
  Save,
  Check,
  ArrowRight,
  Plus,
} from "lucide-react";
import { PickTaskModal } from "@/components/pick-task-modal";

interface CockpitSummary {
  today: string;
  todayLog: {
    id: string;
    date: string;
    project_ids: string[];
    today_goal: string;
    what_did: string;
    what_learned: string;
    blockers: string;
    tomorrow_plan: string;
    notes: string;
  } | null;
  projects: Array<{
    id: string;
    slug: string;
    name: string;
    status: string;
    goal: string;
    current_problem: string;
    tags: string[];
    next_action: {
      id: string;
      title: string;
      priority: number;
      status: string;
      estimated_minutes: number;
    } | null;
    pending_tasks: number;
    total_tasks: number;
  }>;
  completedTodayCount: number;
  recentExperiments: Array<{
    id: string;
    exp_number: number;
    question: string;
    result: string;
    project_name: string;
    project_slug: string;
    tags: string[];
  }>;
  recentBugs: Array<{
    id: string;
    bug_number: number;
    title: string;
    fix: string;
    project_name: string;
    project_slug: string;
    tags: string[];
  }>;
  stats: {
    activeProjectsCount: number;
    totalProjects: number;
    totalExperiments: number;
    totalBugs: number;
  };
}

export default function CockpitPage() {
  const [data, setData] = useState<CockpitSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Daily Log Form State
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [todayGoal, setTodayGoal] = useState("");
  const [whatDid, setWhatDid] = useState("");
  const [whatLearned, setWhatLearned] = useState("");
  const [blockers, setBlockers] = useState("");
  const [tomorrowPlan, setTomorrowPlan] = useState("");
  const [notes, setNotes] = useState("");
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadSummary = useCallback(() => {
    fetch("/api/cockpit/summary")
      .then((res) => res.json())
      .then((summary: CockpitSummary) => {
        setData(summary);
        if (summary.todayLog) {
          setSelectedProjects(summary.todayLog.project_ids || []);
          setTodayGoal(summary.todayLog.today_goal || "");
          setWhatDid(summary.todayLog.what_did || "");
          setWhatLearned(summary.todayLog.what_learned || "");
          setBlockers(summary.todayLog.blockers || "");
          setTomorrowPlan(summary.todayLog.tomorrow_plan || "");
          setNotes(summary.todayLog.notes || "");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Toggle Project Tag in Daily Log
  const toggleProjectTag = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  // Toggle Task Completion
  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      loadSummary();
    } catch (err) {
      console.error("Failed to toggle task", err);
    }
  };

  // Save Daily Log
  const handleSaveLog = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingLog(true);
    try {
      await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: data?.today || new Date().toISOString().split("T")[0],
          project_ids: selectedProjects,
          today_goal: todayGoal,
          what_did: whatDid,
          what_learned: whatLearned,
          blockers,
          tomorrow_plan: tomorrowPlan,
          notes,
        }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      loadSummary();
    } catch (err) {
      console.error("Failed to save log", err);
    } finally {
      setIsSavingLog(false);
    }
  };

  // Handle Picked Task Accepted
  const handleAcceptTask = (task: any) => {
    setTodayGoal(
      `Focus on ${task.projectName}: ${task.taskTitle}`
    );
    if (!selectedProjects.includes(task.projectId)) {
      setSelectedProjects((prev) => [...prev, task.projectId]);
    }
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500 font-mono text-xs animate-pulse">
          INITIALIZING COCKPIT TELEMETRY...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header Bar: Date & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            ENGINEERING WORKSPACE · LIVE
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1 font-mono">
            {formattedDate}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPickerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold font-mono transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>PICK TODAY&apos;S TASK</span>
          </button>

          <button
            onClick={() => handleSaveLog()}
            disabled={isSavingLog}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold font-mono transition-colors ${
              savedSuccess
                ? "bg-emerald-600 text-white"
                : "bg-[#1c2738] hover:bg-[#243347] text-slate-200 border border-[#30425c]"
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>SAVED TO FTS5</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingLog ? "SAVING..." : "SAVE DAILY LOG"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Top Stats Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-[#0e141f] border border-[#1e293b]">
          <div className="text-[11px] font-mono text-slate-400 uppercase">
            Active Projects
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">
            {data?.stats.activeProjectsCount || 0}
          </div>
        </div>
        <div className="p-3.5 rounded-lg bg-[#0e141f] border border-[#1e293b]">
          <div className="text-[11px] font-mono text-slate-400 uppercase">
            Tasks Done Today
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {data?.completedTodayCount || 0}
          </div>
        </div>
        <div className="p-3.5 rounded-lg bg-[#0e141f] border border-[#1e293b]">
          <div className="text-[11px] font-mono text-slate-400 uppercase">
            Experiments Tracked
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            #{data?.stats.totalExperiments || 0}
          </div>
        </div>
        <div className="p-3.5 rounded-lg bg-[#0e141f] border border-[#1e293b]">
          <div className="text-[11px] font-mono text-slate-400 uppercase">
            Bugs Cataloged
          </div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">
            #{data?.stats.totalBugs || 0}
          </div>
        </div>
      </div>

      {/* 3. "WHAT SHOULD I WORK ON TODAY?" - Next Smallest Steps */}
      <div className="p-5 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              What should I work on today?
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Next smallest actionable step per active project:
            </p>
          </div>
          <button
            onClick={() => setIsPickerOpen(true)}
            className="text-xs text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1"
          >
            Deterministic Choice <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {data?.projects.map((project) => {
            const nextAction = project.next_action;
            const isDone = nextAction?.status === "done";

            return (
              <div
                key={project.id}
                className="p-4 rounded-lg bg-[#131b26] border border-[#243347] flex flex-col justify-between hover:border-slate-600 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-slate-200 truncate">
                      {project.name}
                    </span>
                    <Link
                      href={`/projects/${project.slug}`}
                      className="text-slate-500 hover:text-emerald-400 p-0.5"
                      title="Open Project Lab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                    {project.goal}
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#1e293b]">
                    <div className="text-[10px] font-mono text-amber-400/90 uppercase tracking-wide">
                      Next Smallest Step:
                    </div>
                    {nextAction ? (
                      <div className="mt-1 flex items-start gap-2">
                        <button
                          onClick={() => toggleTask(nextAction.id, nextAction.status)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <span
                          className={`text-xs leading-snug ${
                            isDone
                              ? "line-through text-slate-500"
                              : "text-slate-200 font-medium"
                          }`}
                        >
                          {nextAction.title}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-1 text-xs text-slate-500 italic flex items-center justify-between">
                        <span>No next action flagged</span>
                        <Link
                          href={`/projects/${project.slug}`}
                          className="text-[11px] text-emerald-400 hover:underline font-mono"
                        >
                          + Set step
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-[#1e293b]">
                  <span>{project.pending_tasks} remaining</span>
                  <span>{project.total_tasks} total tasks</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. THE DAILY LOG LOOP (The Core 1-Page Log) */}
      <div className="p-5 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-3">
          <div>
            <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Daily Engineering Log · {data?.today}
            </h2>
            <p className="text-xs text-slate-400">
              Your frictionless daily loop: goal → execution → learnings → blockers → next step.
            </p>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Indexed in SQLite FTS5 for future querying
          </div>
        </div>

        <form onSubmit={handleSaveLog} className="space-y-4">
          {/* Question: What am I working on? */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold block">
              1. What am I working on today?
            </label>
            <div className="flex flex-wrap gap-2">
              {data?.projects.map((p) => {
                const isSelected = selectedProjects.includes(p.id);
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => toggleProjectTag(p.id)}
                    className={`px-3 py-1 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 border ${
                      isSelected
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-[#131b26] text-slate-400 border-[#243347] hover:border-slate-500"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-emerald-400" : "bg-slate-600"
                      }`}
                    />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question: Today's Goal */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold block">
              2. Today&apos;s Goal
            </label>
            <input
              type="text"
              value={todayGoal}
              onChange={(e) => setTodayGoal(e.target.value)}
              placeholder="e.g., Boot custom kernel through serial console with earlycon enabled..."
              className="w-full px-3.5 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Question: What did I actually do? */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold block">
              3. What did I actually do?
            </label>
            <textarea
              rows={3}
              value={whatDid}
              onChange={(e) => setWhatDid(e.target.value)}
              placeholder="Concrete actions, commits, terminal commands tested, hardware wireups..."
              className="w-full px-3.5 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Grid: What did I learn? & What is blocking me? */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold block text-emerald-300">
                4. What did I learn?
              </label>
              <textarea
                rows={3}
                value={whatLearned}
                onChange={(e) => setWhatLearned(e.target.value)}
                placeholder="Technical insights, gotchas, documentation discoveries..."
                className="w-full px-3.5 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold block text-rose-300">
                5. What is blocking me?
              </label>
              <textarea
                rows={3}
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                placeholder="Kernel panics, missing adapters, memory limits, toolchain errors..."
                className="w-full px-3.5 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
              />
            </div>
          </div>

          {/* Question: Tomorrow */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold block">
              6. Tomorrow / Next Step
            </label>
            <input
              type="text"
              value={tomorrowPlan}
              onChange={(e) => setTomorrowPlan(e.target.value)}
              placeholder="Immediate action for tomorrow morning..."
              className="w-full px-3.5 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] font-mono text-slate-500">
              Press Save to persist and index across full-text search.
            </span>
            <button
              type="submit"
              disabled={isSavingLog}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold font-mono transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingLog ? "Saving..." : "Save & Finish Day"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 5. Engineering Radar (Recent Experiments & Bugs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Experiments */}
        <div className="p-4 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-mono uppercase font-bold text-slate-200">
                Recent Experiments
              </h3>
            </div>
            <Link
              href="/experiments"
              className="text-[11px] text-amber-400 hover:underline font-mono"
            >
              All Experiments →
            </Link>
          </div>

          <div className="space-y-2.5">
            {data?.recentExperiments.map((exp) => (
              <div
                key={exp.id}
                className="p-3 rounded-lg bg-[#131b26] border border-[#243347] space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold text-amber-400">
                    EXP #{exp.exp_number}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {exp.project_name}
                  </span>
                </div>
                <div className="text-xs text-slate-200 font-medium">
                  {exp.question}
                </div>
                <div className="text-[11px] text-slate-400 font-mono line-clamp-1">
                  Result: {exp.result}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bugs / Problems */}
        <div className="p-4 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-mono uppercase font-bold text-slate-200">
                Recent Problems Cataloged
              </h3>
            </div>
            <Link
              href="/bugs"
              className="text-[11px] text-rose-400 hover:underline font-mono"
            >
              All Bugs →
            </Link>
          </div>

          <div className="space-y-2.5">
            {data?.recentBugs.map((bug) => (
              <div
                key={bug.id}
                className="p-3 rounded-lg bg-[#131b26] border border-[#243347] space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold text-rose-400">
                    BUG #{bug.bug_number}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {bug.project_name}
                  </span>
                </div>
                <div className="text-xs text-slate-200 font-medium">
                  {bug.title}
                </div>
                <div className="text-[11px] text-emerald-400/90 font-mono line-clamp-1">
                  Fix: {bug.fix}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Picker Modal */}
      <PickTaskModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onAcceptTask={handleAcceptTask}
      />
    </div>
  );
}
