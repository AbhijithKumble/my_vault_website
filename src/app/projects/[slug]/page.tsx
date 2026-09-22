"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderGit2,
  CheckCircle2,
  Circle,
  Star,
  Plus,
  FlaskConical,
  Bug,
  Scale,
  Terminal,
  BookOpen,
  ArrowLeft,
  AlertCircle,
  Copy,
  Check,
  Trash2,
  Edit3,
  Save,
  X,
} from "lucide-react";

interface ProjectDetailResponse {
  project: {
    id: string;
    slug: string;
    name: string;
    status: string;
    goal: string;
    why: string;
    current_problem: string;
    architecture: string;
    tags: string[];
    created_at: string;
    updated_at: string;
  };
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    is_next_action: number;
    priority: number;
    estimated_minutes: number;
  }>;
  experiments: Array<{
    id: string;
    exp_number: number;
    question: string;
    result: string;
    conclusion: string;
    tags: string[];
  }>;
  bugs: Array<{
    id: string;
    bug_number: number;
    title: string;
    root_cause: string;
    fix: string;
    tags: string[];
  }>;
  decisions: Array<{
    id: string;
    dec_number: number;
    decision: string;
    why: string;
    revisit_date: string;
  }>;
  commands: Array<{
    id: string;
    command: string;
    explanation: string;
    category: string;
    tags: string[];
  }>;
  notes: Array<{
    id: string;
    title: string;
    category: string;
    content: string;
    tags: string[];
  }>;
}

export default function ProjectLaboratoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [data, setData] = useState<ProjectDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "tasks" | "experiments" | "bugs" | "commands" | "decisions" | "notes"
  >("overview");

  const router = useRouter();

  // Inline new task form
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isNextActionCheck, setIsNextActionCheck] = useState(false);

  // Copied command tracker
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Project Modal State
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectStatus, setEditProjectStatus] = useState("active");
  const [editProjectGoal, setEditProjectGoal] = useState("");
  const [editProjectWhy, setEditProjectWhy] = useState("");
  const [editProjectCurrentProblem, setEditProjectCurrentProblem] = useState("");
  const [editProjectArchitecture, setEditProjectArchitecture] = useState("");
  const [editProjectTagInput, setEditProjectTagInput] = useState("");
  const [isSavingProject, setIsSavingProject] = useState(false);

  // Task Inline Edit State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskMinutes, setEditTaskMinutes] = useState(30);

  const openEditProjectModal = () => {
    if (!data?.project) return;
    setEditProjectName(data.project.name);
    setEditProjectStatus(data.project.status);
    setEditProjectGoal(data.project.goal || "");
    setEditProjectWhy(data.project.why || "");
    setEditProjectCurrentProblem(data.project.current_problem || "");
    setEditProjectArchitecture(data.project.architecture || "");
    setEditProjectTagInput((data.project.tags || []).join(", "));
    setIsEditProjectModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProjectName.trim()) return;

    setIsSavingProject(true);
    const tags = editProjectTagInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      await fetch(`/api/projects/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editProjectName,
          status: editProjectStatus,
          goal: editProjectGoal,
          why: editProjectWhy,
          current_problem: editProjectCurrentProblem,
          architecture: editProjectArchitecture,
          tags,
        }),
      });
      setIsEditProjectModalOpen(false);
      fetchProject();
    } catch (err) {
      console.error("Failed to update project:", err);
    } finally {
      setIsSavingProject(false);
    }
  };

  const startEditTask = (t: any) => {
    setEditingTaskId(t.id);
    setEditTaskTitle(t.title);
    setEditTaskMinutes(t.estimated_minutes || 30);
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
  };

  const saveEditTask = async (taskId: string) => {
    if (!editTaskTitle.trim()) return;
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          title: editTaskTitle,
          estimated_minutes: Number(editTaskMinutes) || 30,
        }),
      });
      setEditingTaskId(null);
      fetchProject();
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const fetchProject = useCallback(() => {
    fetch(`/api/projects/${slug}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleDeleteProject = async () => {
    if (!confirm(`Are you sure you want to delete project "${data?.project?.name}"? This will delete all its tasks and unlink related records.`)) return;
    await fetch(`/api/projects/${slug}`, { method: "DELETE" });
    router.push("/projects");
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    await fetch(`/api/tasks?id=${taskId}`, { method: "DELETE" });
    fetchProject();
  };

  const handleDeleteExperiment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this experiment?")) return;
    await fetch(`/api/experiments?id=${id}`, { method: "DELETE" });
    fetchProject();
  };

  const handleDeleteBug = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bug?")) return;
    await fetch(`/api/bugs?id=${id}`, { method: "DELETE" });
    fetchProject();
  };

  const handleDeleteCommand = async (id: string) => {
    if (!confirm("Are you sure you want to delete this command?")) return;
    await fetch(`/api/commands?id=${id}`, { method: "DELETE" });
    fetchProject();
  };

  const handleDeleteDecision = async (id: string) => {
    if (!confirm("Are you sure you want to delete this decision?")) return;
    await fetch(`/api/decisions?id=${id}`, { method: "DELETE" });
    fetchProject();
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this knowledge note?")) return;
    await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
    fetchProject();
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status: newStatus }),
    });
    fetchProject();
  };

  const toggleNextAction = async (taskId: string, isNext: number) => {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, is_next_action: isNext ? 0 : 1 }),
    });
    fetchProject();
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !data?.project) return;

    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: data.project.id,
        title: newTaskTitle,
        is_next_action: isNextActionCheck,
        priority: isNextActionCheck ? 1 : 2,
        estimated_minutes: 30,
      }),
    });
    setNewTaskTitle("");
    setIsNextActionCheck(false);
    fetchProject();
  };

  const copyCommand = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500 font-mono text-xs animate-pulse">
          LOADING PROJECT LABORATORY...
        </div>
      </div>
    );
  }

  if (!data?.project) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-slate-300 font-mono">Project not found.</div>
        <Link
          href="/projects"
          className="text-xs text-emerald-400 font-mono hover:underline"
        >
          ← Return to Projects
        </Link>
      </div>
    );
  }

  const p = data.project;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div className="space-y-1">
          <Link
            href="/projects"
            className="text-xs text-slate-400 hover:text-slate-200 font-mono flex items-center gap-1.5 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All Projects
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono text-slate-100">
              {p.name}
            </h1>
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              {p.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">{p.goal}</p>
        </div>

        {/* Tags & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {p.tags.map((t) => (
              <span
                key={t}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131b26] text-slate-300 border border-[#243347]"
              >
                #{t}
              </span>
            ))}
          </div>
          <button
            onClick={openEditProjectModal}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#1c2738] hover:bg-[#243347] text-slate-200 border border-[#30425c] text-xs font-mono transition-colors"
            title="Edit this project"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Project</span>
          </button>
          <button
            onClick={handleDeleteProject}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono transition-colors"
            title="Delete this project"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Project</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#1e293b] overflow-x-auto pb-1 text-xs font-mono">
        {[
          { id: "overview", label: "Overview & Architecture", count: null },
          { id: "tasks", label: "Tasks & Next Actions", count: data.tasks.length },
          { id: "experiments", label: "Experiments", count: data.experiments.length },
          { id: "bugs", label: "Bugs / Issues", count: data.bugs.length },
          { id: "commands", label: "Commands", count: data.commands.length },
          { id: "decisions", label: "Decisions", count: data.decisions.length },
          { id: "notes", label: "Notes / Wiki", count: data.notes.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === tab.id
                ? "bg-[#1c2738] text-emerald-300 font-semibold border border-[#30425c]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#131b26] text-slate-400">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* WHY Section */}
            <div className="p-5 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                WHY ARE WE BUILDING THIS?
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                {p.why || "No rationale recorded yet."}
              </p>
            </div>

            {/* CURRENT PROBLEM */}
            <div className="p-5 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-rose-400 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> CURRENT BLOCKER / PROBLEM
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                {p.current_problem || "No active blocker identified."}
              </p>
            </div>
          </div>

          {/* ARCHITECTURE DIAGRAM */}
          <div className="p-5 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                ARCHITECTURE / TOPOLOGY
              </div>
              <span className="text-[10px] font-mono text-slate-500">ASCII Architecture Tree</span>
            </div>
            <pre className="p-4 rounded-lg bg-[#131b26] border border-[#243347] text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed">
              {p.architecture || "No architecture diagram specified."}
            </pre>
          </div>
        </div>
      )}

      {/* Tab: TASKS */}
      {activeTab === "tasks" && (
        <div className="p-5 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-5">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
            <div>
              <h2 className="text-sm font-bold font-mono text-slate-100 uppercase">
                Project Task Matrix
              </h2>
              <p className="text-xs text-slate-400">
                Star a task to designate it as the immediate next smallest action.
              </p>
            </div>
          </div>

          {/* New Task Inline Form */}
          <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add next actionable task..."
              className="flex-1 px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
            <label className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs font-mono text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isNextActionCheck}
                onChange={(e) => setIsNextActionCheck(e.target.checked)}
                className="accent-amber-400"
              />
              <span className="text-amber-400">Set as Next Action</span>
            </label>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold font-mono"
            >
              Add Task
            </button>
          </form>

          {/* Tasks List */}
          <div className="space-y-2">
            {data.tasks.map((t) => {
              const isDone = t.status === "done";
              const isNext = t.is_next_action === 1;
              const isEditing = editingTaskId === t.id;

              if (isEditing) {
                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-lg border bg-[#1c2738] border-emerald-500/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editTaskTitle}
                        onChange={(e) => setEditTaskTitle(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                        placeholder="Task title..."
                        autoFocus
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editTaskMinutes}
                          onChange={(e) => setEditTaskMinutes(Number(e.target.value))}
                          className="w-16 px-2 py-1.5 rounded bg-[#131b26] border border-[#243347] text-xs text-slate-100 text-center font-mono focus:outline-hidden focus:border-emerald-500"
                          min="1"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => saveEditTask(t.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-medium transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={cancelEditTask}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-[#131b26] hover:bg-[#243347] text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={t.id}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                    isNext
                      ? "bg-[#182333] border-amber-500/40"
                      : "bg-[#131b26] border-[#243347]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => toggleTaskStatus(t.id, t.status)}
                      className="text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <span
                      className={`text-xs ${
                        isDone
                          ? "line-through text-slate-500"
                          : "text-slate-200 font-medium"
                      }`}
                    >
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleNextAction(t.id, t.is_next_action)}
                      title={isNext ? "Remove next action" : "Set as next action"}
                      className={`p-1 rounded transition-colors ${
                        isNext
                          ? "text-amber-400 bg-amber-500/10"
                          : "text-slate-500 hover:text-amber-400"
                      }`}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${isNext ? "fill-amber-400" : ""}`}
                      />
                    </button>
                    <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-[#1c2738]">
                      ~{t.estimated_minutes}m
                    </span>
                    <button
                      onClick={() => startEditTask(t)}
                      className="text-slate-500 hover:text-emerald-400 p-1 rounded hover:bg-[#1c2738] transition-colors"
                      title="Edit task"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-[#1c2738] transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: EXPERIMENTS */}
      {activeTab === "experiments" && (
        <div className="p-5 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
            <div>
              <h2 className="text-sm font-bold font-mono text-slate-100 uppercase">
                Experiments Conducted
              </h2>
              <p className="text-xs text-slate-400">
                Scientific tests on this project (Hypothesis → Command → Result).
              </p>
            </div>
            <Link
              href="/experiments"
              className="text-xs font-mono text-amber-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Log Experiment
            </Link>
          </div>

          <div className="space-y-3">
            {data.experiments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">
                No experiments recorded for this project yet.
              </div>
            ) : (
              data.experiments.map((exp) => (
                <div
                  key={exp.id}
                  className="p-4 rounded-lg bg-[#131b26] border border-[#243347] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      EXPERIMENT #{exp.exp_number}
                    </span>
                    <button
                      onClick={() => handleDeleteExperiment(exp.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-[#1c2738] transition-colors"
                      title="Delete experiment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    {exp.question}
                  </h3>
                  <div className="text-xs text-slate-300 font-mono bg-[#0e141f] p-2 rounded border border-[#1e293b]">
                    Result: {exp.result}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Conclusion: {exp.conclusion}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: COMMANDS */}
      {activeTab === "commands" && (
        <div className="p-5 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
            <h2 className="text-sm font-bold font-mono text-slate-100 uppercase">
              Project Command Vault
            </h2>
            <Link
              href="/commands"
              className="text-xs font-mono text-emerald-400 hover:underline"
            >
              + New Command
            </Link>
          </div>

          <div className="space-y-3">
            {data.commands.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">
                No commands saved for this project yet.
              </div>
            ) : (
              data.commands.map((cmd) => (
                <div
                  key={cmd.id}
                  className="p-3.5 rounded-lg bg-[#131b26] border border-[#243347] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400 font-mono">
                      {cmd.explanation}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyCommand(cmd.command, cmd.id)}
                        className="text-slate-400 hover:text-emerald-400 p-1 rounded hover:bg-[#1c2738] transition-colors"
                        title="Copy command"
                      >
                        {copiedId === cmd.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteCommand(cmd.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-[#1c2738] transition-colors"
                        title="Delete command"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <pre className="p-2.5 rounded bg-[#090d16] border border-[#1e293b] text-xs font-mono text-emerald-300 overflow-x-auto">
                    {cmd.command}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: BUGS */}
      {activeTab === "bugs" && (
        <div className="p-5 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
            <h2 className="text-sm font-bold font-mono text-slate-100 uppercase">
              Bugs Encountered
            </h2>
            <Link
              href="/bugs"
              className="text-xs font-mono text-rose-400 hover:underline"
            >
              + Log Problem
            </Link>
          </div>

          <div className="space-y-3">
            {data.bugs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">
                No bugs logged for this project yet.
              </div>
            ) : (
              data.bugs.map((bug) => (
                <div
                  key={bug.id}
                  className="p-4 rounded-lg bg-[#131b26] border border-[#243347] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-rose-400">
                      BUG #{bug.bug_number}
                    </span>
                    <button
                      onClick={() => handleDeleteBug(bug.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-[#1c2738] transition-colors"
                      title="Delete bug"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    {bug.title}
                  </h3>
                  <div className="text-xs text-slate-300 font-mono">
                    <span className="text-slate-400 font-semibold">Root Cause:</span>{" "}
                    {bug.root_cause}
                  </div>
                  <div className="text-xs text-emerald-300 font-mono bg-[#0e141f] p-2 rounded border border-[#1e293b]">
                    Fix: {bug.fix}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: DECISIONS */}
      {activeTab === "decisions" && (
        <div className="p-5 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
            <h2 className="text-sm font-bold font-mono text-slate-100 uppercase">
              Architectural Decisions
            </h2>
            <Link
              href="/decisions"
              className="text-xs font-mono text-purple-400 hover:underline"
            >
              + Record Decision
            </Link>
          </div>

          <div className="space-y-3">
            {data.decisions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">
                No architectural decisions recorded for this project yet.
              </div>
            ) : (
              data.decisions.map((dec) => (
                <div
                  key={dec.id}
                  className="p-4 rounded-lg bg-[#131b26] border border-[#243347] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-purple-400">
                      DECISION #{dec.dec_number}
                    </span>
                    <button
                      onClick={() => handleDeleteDecision(dec.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-[#1c2738] transition-colors"
                      title="Delete decision"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-sm font-semibold text-slate-100">
                    {dec.decision}
                  </div>
                  <div className="text-xs text-slate-300 font-mono">
                    <span className="text-slate-400 font-semibold">Why:</span>{" "}
                    {dec.why}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: NOTES */}
      {activeTab === "notes" && (
        <div className="p-5 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
            <h2 className="text-sm font-bold font-mono text-slate-100 uppercase">
              Knowledge Notes & Wiki
            </h2>
            <Link
              href="/knowledge"
              className="text-xs font-mono text-indigo-400 hover:underline"
            >
              + Create Note
            </Link>
          </div>

          <div className="space-y-3">
            {data.notes.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">
                No knowledge notes attached to this project.
              </div>
            ) : (
              data.notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-lg bg-[#131b26] border border-[#243347] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-100">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c2738] text-indigo-300">
                        {note.category}
                      </span>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-[#1c2738] transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 font-mono whitespace-pre-wrap line-clamp-4">
                    {note.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#0e141f] border border-[#243347] rounded-xl max-w-2xl w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <h2 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                Edit Project: {p.name}
              </h2>
              <button
                onClick={() => setIsEditProjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">
                    Project Name <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editProjectName}
                    onChange={(e) => setEditProjectName(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Status</label>
                  <select
                    value={editProjectStatus}
                    onChange={(e) => setEditProjectStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                  >
                    <option value="active">Active (Currently working)</option>
                    <option value="paused">Paused (On backburner)</option>
                    <option value="archived">Archived (Complete/Shelved)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Core Goal / Objective</label>
                <input
                  type="text"
                  value={editProjectGoal}
                  onChange={(e) => setEditProjectGoal(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Why Build This? (Motivation)</label>
                <textarea
                  rows={2}
                  value={editProjectWhy}
                  onChange={(e) => setEditProjectWhy(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Current Problem / Blocker</label>
                <input
                  type="text"
                  value={editProjectCurrentProblem}
                  onChange={(e) => setEditProjectCurrentProblem(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-rose-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Architecture Diagram (ASCII / Text)</label>
                <textarea
                  rows={4}
                  value={editProjectArchitecture}
                  onChange={(e) => setEditProjectArchitecture(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-emerald-300 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Tags (comma separated)</label>
                <input
                  type="text"
                  value={editProjectTagInput}
                  onChange={(e) => setEditProjectTagInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setIsEditProjectModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProject}
                  className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold font-mono"
                >
                  {isSavingProject ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
