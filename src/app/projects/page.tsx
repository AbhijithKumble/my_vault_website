"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FolderGit2,
  Plus,
  ArrowRight,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Edit3,
} from "lucide-react";

interface ProjectItem {
  id: string;
  slug: string;
  name: string;
  status: string;
  goal: string;
  why: string;
  current_problem: string;
  architecture?: string;
  tags: string[];
  next_action: { id: string; title: string } | null;
  total_tasks: number;
  done_tasks: number;
  experiment_count: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // New project form state
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [why, setWhy] = useState("");
  const [currentProblem, setCurrentProblem] = useState("");
  const [architecture, setArchitecture] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit project state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState("");
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [editGoal, setEditGoal] = useState("");
  const [editWhy, setEditWhy] = useState("");
  const [editCurrentProblem, setEditCurrentProblem] = useState("");
  const [editArchitecture, setEditArchitecture] = useState("");
  const [editTagInput, setEditTagInput] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const openEditModal = async (p: ProjectItem) => {
    setEditingSlug(p.slug);
    setEditName(p.name);
    setEditStatus(p.status);
    setEditGoal(p.goal || "");
    setEditWhy(p.why || "");
    setEditCurrentProblem(p.current_problem || "");
    setEditTagInput((p.tags || []).join(", "));
    setEditArchitecture("");
    setIsEditModalOpen(true);

    // Fetch full project to get architecture diagram if available
    try {
      const res = await fetch(`/api/projects/${p.slug}`);
      const data = await res.json();
      if (data?.project) {
        setEditWhy(data.project.why || "");
        setEditArchitecture(data.project.architecture || "");
      }
    } catch (err) {
      console.error("Failed to load project details for editing", err);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setIsSavingEdit(true);
    const tags = editTagInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      await fetch(`/api/projects/${editingSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          status: editStatus,
          goal: editGoal,
          why: editWhy,
          current_problem: editCurrentProblem,
          architecture: editArchitecture,
          tags,
        }),
      });
      setIsEditModalOpen(false);
      fetchProjects();
    } catch (err) {
      console.error("Failed to update project:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const fetchProjects = useCallback(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = projects.filter((p) => {
    if (statusFilter === "all") return true;
    return p.status === statusFilter;
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const tags = tagInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          goal,
          why,
          current_problem: currentProblem,
          architecture,
          tags,
          status: "active",
        }),
      });
      setIsModalOpen(false);
      setName("");
      setGoal("");
      setWhy("");
      setCurrentProblem("");
      setArchitecture("");
      setTagInput("");
      fetchProjects();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, slug: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete project "${name}"? This will delete its tasks and unlink all associated experiments and notes.`)) return;
    await fetch(`/api/projects/${slug}`, { method: "DELETE" });
    fetchProjects();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold tracking-wider uppercase">
            <FolderGit2 className="w-4 h-4" />
            <span>ENGINEERING REPOSITORIES & LABS</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 font-mono mt-1">
            Projects as First-Class Objects
          </h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold font-mono transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>NEW PROJECT LAB</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2">
        {[
          { id: "all", label: "All Projects" },
          { id: "active", label: "🟢 Active" },
          { id: "paused", label: "🟡 Paused" },
          { id: "archived", label: "⚪ Archived" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
              statusFilter === tab.id
                ? "bg-[#1c2738] text-emerald-300 font-semibold border border-[#30425c]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs font-mono text-slate-500">
            Loading project laboratories...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs font-mono text-slate-500">
            No projects in this category.
          </div>
        ) : (
          filteredProjects.map((p) => {
            const progress =
              p.total_tasks > 0
                ? Math.round((p.done_tasks / p.total_tasks) * 100)
                : 0;

            const statusColors: Record<string, string> = {
              active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
              paused: "bg-amber-500/10 text-amber-400 border-amber-500/30",
              archived: "bg-slate-500/10 text-slate-400 border-slate-500/30",
            };

            return (
              <div
                key={p.id}
                className="p-5 rounded-xl bg-[#0e141f] border border-[#1e293b] flex flex-col justify-between hover:border-slate-600 transition-colors relative group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        statusColors[p.status] || statusColors.active
                      }`}
                    >
                      {p.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <FlaskConical className="w-3 h-3 text-amber-400" />
                        {p.experiment_count} exps
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openEditModal(p);
                        }}
                        className="text-slate-500 hover:text-emerald-400 p-1 rounded hover:bg-[#1c2738] transition-colors"
                        title="Edit project"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteProject(e, p.slug, p.name)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-[#1c2738] transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <Link href={`/projects/${p.slug}`}>
                    <h2 className="text-base font-bold font-mono text-slate-100 mt-2 hover:text-emerald-400 transition-colors">
                      {p.name}
                    </h2>
                  </Link>

                  <p className="text-xs text-slate-400 font-mono mt-1 line-clamp-2">
                    {p.goal || p.why}
                  </p>

                  {/* Current Problem if set */}
                  {p.current_problem && (
                    <div className="mt-3 p-2.5 rounded-md bg-[#131b26] border border-[#243347] text-xs space-y-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-rose-400 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3 h-3" /> Current Problem:
                      </div>
                      <div className="text-slate-300 text-[11px] line-clamp-2">
                        {p.current_problem}
                      </div>
                    </div>
                  )}

                  {/* Next Action */}
                  <div className="mt-3 pt-3 border-t border-[#1e293b]">
                    <div className="text-[10px] font-mono uppercase text-amber-400 tracking-wider">
                      Next Step:
                    </div>
                    <div className="text-xs text-slate-200 mt-0.5 line-clamp-1 font-medium">
                      {p.next_action?.title || (
                        <span className="text-slate-500 italic">No action specified</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1e293b] space-y-2">
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Tasks: {p.done_tasks}/{p.total_tasks}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#1c2738] overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex flex-wrap gap-1">
                      {p.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#131b26] text-slate-400 border border-[#243347]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/projects/${p.slug}`}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1"
                    >
                      <span>Lab</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Project Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#0e141f] border border-[#243347] rounded-xl shadow-2xl overflow-hidden p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase">
                Initialize New Project Laboratory
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Project Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., ARM Remote Build Server"
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Goal / Objective</label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g., Turn Tab M7 into an ARM CI/build machine"
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Why are you building this?</label>
                <textarea
                  rows={2}
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                  placeholder="e.g., Learn embedded Linux systems and cross-compilation toolchains..."
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Current Technical Problem</label>
                <input
                  type="text"
                  value={currentProblem}
                  onChange={(e) => setCurrentProblem(e.target.value)}
                  placeholder="e.g., SSH dropouts during heavy compilations..."
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Architecture Diagram (ASCII / Text)</label>
                <textarea
                  rows={3}
                  value={architecture}
                  onChange={(e) => setArchitecture(e.target.value)}
                  placeholder={`Host (Fedora) ──[SSH]──> Target (Tab M7)`}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="arm, linux, embedded, ci"
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold font-mono"
                >
                  {isSubmitting ? "Creating..." : "Initialize Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-xl bg-[#0e141f] border border-[#1e293b] p-6 space-y-4 shadow-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold font-mono text-slate-100 uppercase">
                  Edit Project Lab: {editName}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">
                    Project Name <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
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
                  value={editGoal}
                  onChange={(e) => setEditGoal(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Why Build This? (Motivation)</label>
                <textarea
                  rows={2}
                  value={editWhy}
                  onChange={(e) => setEditWhy(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Current Problem / Blocker</label>
                <input
                  type="text"
                  value={editCurrentProblem}
                  onChange={(e) => setEditCurrentProblem(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-rose-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Architecture Diagram (ASCII / Text)</label>
                <textarea
                  rows={4}
                  value={editArchitecture}
                  onChange={(e) => setEditArchitecture(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-emerald-300 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Tags (comma separated)</label>
                <input
                  type="text"
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold font-mono"
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
