"use client";

import { useEffect, useState, useCallback } from "react";
import { Bug, Plus, Search, FolderGit2, X, Wrench, Lightbulb, AlertTriangle, Trash2, Edit3 } from "lucide-react";

interface BugItem {
  id: string;
  bug_number: number;
  project_id: string;
  project_name: string;
  project_slug: string;
  title: string;
  symptoms: string;
  tried: string;
  root_cause: string;
  fix: string;
  lesson: string;
  tags: string[];
  created_at: string;
}

export default function BugsPage() {
  const [bugs, setBugs] = useState<BugItem[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [tried, setTried] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [fix, setFix] = useState("");
  const [lesson, setLesson] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editProjectId, setEditProjectId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editSymptoms, setEditSymptoms] = useState("");
  const [editTried, setEditTried] = useState("");
  const [editRootCause, setEditRootCause] = useState("");
  const [editFix, setEditFix] = useState("");
  const [editLesson, setEditLesson] = useState("");
  const [editTagInput, setEditTagInput] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const openEditModal = (bug: BugItem) => {
    setEditingId(bug.id);
    setEditProjectId(bug.project_id || "");
    setEditTitle(bug.title);
    setEditSymptoms(bug.symptoms || "");
    setEditTried(bug.tried || "");
    setEditRootCause(bug.root_cause || "");
    setEditFix(bug.fix || "");
    setEditLesson(bug.lesson || "");
    setEditTagInput((bug.tags || []).join(", "));
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    setIsSavingEdit(true);
    const tags = editTagInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      await fetch("/api/bugs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          project_id: editProjectId || null,
          title: editTitle,
          symptoms: editSymptoms,
          tried: editTried,
          root_cause: editRootCause,
          fix: editFix,
          lesson: editLesson,
          tags,
        }),
      });
      setIsEditModalOpen(false);
      fetchBugs();
    } catch (err) {
      console.error("Failed to update bug:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const fetchBugs = useCallback(() => {
    fetch("/api/bugs")
      .then((res) => res.json())
      .then((data) => {
        setBugs(data.bugs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchBugs();
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []));
  }, [fetchBugs]);

  const handleCreateBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const tags = tagInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId || null,
          title,
          symptoms,
          tried,
          root_cause: rootCause,
          fix,
          lesson,
          tags,
        }),
      });
      setIsModalOpen(false);
      setTitle("");
      setSymptoms("");
      setTried("");
      setRootCause("");
      setFix("");
      setLesson("");
      setTagInput("");
      fetchBugs();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBug = async (id: string, num: number) => {
    if (!confirm(`Are you sure you want to delete BUG #${num}?`)) return;
    await fetch(`/api/bugs?id=${id}`, { method: "DELETE" });
    fetchBugs();
  };

  const filtered = bugs.filter((b) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      b.title.toLowerCase().includes(term) ||
      b.symptoms?.toLowerCase().includes(term) ||
      b.root_cause?.toLowerCase().includes(term) ||
      b.fix?.toLowerCase().includes(term) ||
      b.lesson?.toLowerCase().includes(term) ||
      b.project_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-rose-400 font-semibold tracking-wider uppercase">
            <Bug className="w-4 h-4" />
            <span>INCIDENT DATABASE</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 font-mono mt-1">
            Problem & Bug Journal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build your personal debugging database: symptoms → trials → root cause → fix → lesson.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold font-mono transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>LOG PROBLEM / BUG</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bugs by keyword (e.g. ogre2, wayland, panic)..."
          className="w-full pl-9 pr-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden"
        />
      </div>

      {/* Bug Cards Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-slate-500">
            Loading bug journal...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-slate-500">
            No incidents found.
          </div>
        ) : (
          filtered.map((bug) => (
            <div
              key={bug.id}
              className="p-5 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-bold text-rose-400">
                    BUG #{bug.bug_number.toString().padStart(3, "0")}
                  </span>
                  {bug.project_name && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <FolderGit2 className="w-3 h-3" />
                      {bug.project_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-wrap gap-1">
                    {bug.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#131b26] text-slate-400 border border-[#243347]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => openEditModal(bug)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-[#1c2738] transition-colors"
                    title="Edit bug entry"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBug(bug.id, bug.bug_number)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-[#1c2738] transition-colors"
                    title="Delete bug entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-100 font-mono">
                  {bug.title}
                </h2>
              </div>

              {/* Symptoms & What I Tried */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-lg bg-[#131b26] border border-[#243347] space-y-1">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" /> Symptoms:
                  </div>
                  <div className="text-slate-300 whitespace-pre-wrap">{bug.symptoms}</div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#131b26] border border-[#243347] space-y-1">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-amber-400" /> What I Tried:
                  </div>
                  <div className="text-slate-300 whitespace-pre-wrap">{bug.tried}</div>
                </div>
              </div>

              {/* Root Cause */}
              {bug.root_cause && (
                <div className="p-3.5 rounded-lg bg-[#111823] border border-[#243347] text-xs font-mono space-y-1">
                  <div className="text-[10px] uppercase text-amber-400 font-semibold">
                    Root Cause:
                  </div>
                  <div className="text-slate-200">{bug.root_cause}</div>
                </div>
              )}

              {/* Fix & Lesson */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                  <div className="text-[10px] uppercase text-emerald-400 font-semibold">
                    Verified Fix:
                  </div>
                  <div className="text-slate-200 whitespace-pre-wrap">{bug.fix}</div>
                </div>

                <div className="p-3.5 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-1">
                  <div className="text-[10px] uppercase text-blue-400 font-semibold flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> Key Engineering Lesson:
                  </div>
                  <div className="text-slate-200 whitespace-pre-wrap">{bug.lesson}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Log Bug Modal */}
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
                Catalog Technical Problem / Incident
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBug} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Associated Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-rose-500"
                  >
                    <option value="">No Project (General)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="wayland, ogre2, opengl"
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Problem Summary *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Gazebo fails to load OGRE2 plugin on Wayland"
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Symptoms & Error Output</label>
                <textarea
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Segfault on start: 'OGRE EXCEPTION(7:InternalErrorException)...'"
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">What I Tried (1., 2., 3.)</label>
                <textarea
                  rows={2}
                  value={tried}
                  onChange={(e) => setTried(e.target.value)}
                  placeholder="1. Tested LIBGL_ALWAYS_SOFTWARE=1&#10;2. Checked nvidia driver symlinks..."
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Root Cause</label>
                <input
                  type="text"
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="EGL context initialization failed under native Wayland..."
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Fix</label>
                  <textarea
                    rows={2}
                    value={fix}
                    onChange={(e) => setFix(e.target.value)}
                    placeholder="Export GDK_BACKEND=x11..."
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Engineering Lesson</label>
                  <textarea
                    rows={2}
                    value={lesson}
                    onChange={(e) => setLesson(e.target.value)}
                    placeholder="Always inspect whether 3D engines support Wayland..."
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                  />
                </div>
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
                  className="px-4 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold font-mono"
                >
                  {isSubmitting ? "Cataloging..." : "Save to Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bug Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-xl bg-[#0e141f] border border-[#1e293b] p-5 space-y-4 shadow-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold font-mono text-slate-100 uppercase">
                  Edit Bug & Problem Report
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Associated Project</label>
                  <select
                    value={editProjectId}
                    onChange={(e) => setEditProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-rose-500 font-mono"
                  >
                    <option value="">None (Independent)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={editTagInput}
                    onChange={(e) => setEditTagInput(e.target.value)}
                    placeholder="ros, gazebo, wayland, ogre"
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">
                  Bug Title / Problem <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Symptoms</label>
                <textarea
                  rows={2}
                  value={editSymptoms}
                  onChange={(e) => setEditSymptoms(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">What I Tried (1., 2., 3.)</label>
                <textarea
                  rows={2}
                  value={editTried}
                  onChange={(e) => setEditTried(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Root Cause</label>
                <input
                  type="text"
                  value={editRootCause}
                  onChange={(e) => setEditRootCause(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Fix</label>
                  <textarea
                    rows={2}
                    value={editFix}
                    onChange={(e) => setEditFix(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Engineering Lesson</label>
                  <textarea
                    rows={2}
                    value={editLesson}
                    onChange={(e) => setEditLesson(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                  />
                </div>
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
                  className="px-4 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold font-mono"
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
