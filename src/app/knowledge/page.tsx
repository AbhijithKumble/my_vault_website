"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen,
  Plus,
  Search,
  FolderGit2,
  X,
  Layers,
  Code2,
  Cpu,
  Terminal,
  Trash2,
  Edit3,
  Save,
} from "lucide-react";

interface KnowledgeNote {
  id: string;
  project_id: string;
  project_name: string;
  project_slug: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export default function KnowledgePage() {
  const [notes, setNotes] = useState<KnowledgeNote[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedNote, setSelectedNote] = useState<KnowledgeNote | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("kernel");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("kernel");
  const [editProjectId, setEditProjectId] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = (note: KnowledgeNote) => {
    setEditTitle(note.title);
    setEditCategory(note.category);
    setEditProjectId(note.project_id || "");
    setEditContent(note.content);
    setEditTags((note.tags || []).join(", "));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEditing = async () => {
    if (!selectedNote || !editTitle.trim()) return;
    setIsSaving(true);
    const tags = editTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      await fetch("/api/knowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedNote.id,
          title: editTitle,
          category: editCategory,
          project_id: editProjectId || null,
          content: editContent,
          tags,
        }),
      });

      const matchedProj = projects.find((p) => p.id === editProjectId);
      const updated: KnowledgeNote = {
        ...selectedNote,
        title: editTitle,
        category: editCategory,
        project_id: editProjectId,
        project_name: matchedProj ? matchedProj.name : "",
        content: editContent,
        tags,
      };
      setSelectedNote(updated);
      setIsEditing(false);
      fetchNotes();
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchNotes = useCallback(() => {
    fetch("/api/knowledge")
      .then((res) => res.json())
      .then((data) => {
        const list = data.notes || [];
        setNotes(list);
        if (list.length > 0) {
          setSelectedNote(list[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchNotes();
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []));
  }, [fetchNotes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const tags = tagInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId || null,
          title,
          category,
          content,
          tags,
        }),
      });
      setIsModalOpen(false);
      setTitle("");
      setContent("");
      setTagInput("");
      fetchNotes();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (id: string, noteTitle: string) => {
    if (!confirm(`Are you sure you want to delete note "${noteTitle}"?`)) return;
    await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
    setSelectedNote(null);
    fetchNotes();
  };

  const categories = [
    { id: "all", label: "All Topics" },
    { id: "kernel", label: "Linux Kernel" },
    { id: "embedded", label: "Embedded Systems" },
    { id: "networking", label: "Networking" },
    { id: "tooling", label: "Compilers & Tooling" },
    { id: "general", label: "General Systems" },
  ];

  const filtered = notes.filter((n) => {
    if (categoryFilter !== "all" && n.category !== categoryFilter) {
      return false;
    }
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      n.title.toLowerCase().includes(term) ||
      n.content.toLowerCase().includes(term) ||
      n.tags.some((t) => t.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-semibold tracking-wider uppercase">
            <BookOpen className="w-4 h-4" />
            <span>KNOWLEDGE GRAPH & WIKI</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 font-mono mt-1">
            Technical Knowledge Base
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Topic knowledge notes connected directly to projects and hardware labs.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold font-mono transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>NEW KNOWLEDGE NOTE</span>
        </button>
      </div>

      {/* Categories & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap ${
                categoryFilter === cat.id
                  ? "bg-[#1c2738] text-indigo-300 font-semibold border border-[#30425c]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search knowledge..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Main split view */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Notes sidebar */}
        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-8 text-center text-xs font-mono text-slate-500">
              Loading notes...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-slate-500">
              No notes in this category.
            </div>
          ) : (
            filtered.map((note) => {
              const isSelected = selectedNote?.id === note.id;

              return (
                <div
                  key={note.id}
                  onClick={() => {
                    setSelectedNote(note);
                    setIsEditing(false);
                  }}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#182333] border-indigo-500/40"
                      : "bg-[#0e141f] border-[#1e293b] hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#131b26] text-indigo-300 border border-[#243347]">
                      {note.category}
                    </span>
                    {note.project_name && (
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <FolderGit2 className="w-3 h-3 text-emerald-400" />
                        {note.project_name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold font-mono text-slate-100 mt-1.5">
                    {note.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {note.content.replace(/[#*`]/g, "")}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Note reader / editor */}
        <div className="md:col-span-2">
          {selectedNote ? (
            <div className="p-6 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-4">
              <div className="border-b border-[#1e293b] pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="px-2 py-1 rounded bg-[#131b26] border border-[#243347] text-xs font-mono text-indigo-300 focus:outline-hidden"
                      >
                        <option value="kernel">Kernel & OS</option>
                        <option value="embedded">Embedded & Drivers</option>
                        <option value="networking">Networking & Protocols</option>
                        <option value="tooling">Tooling & Workflow</option>
                        <option value="general">General</option>
                      </select>
                    ) : (
                      <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        {selectedNote.category}
                      </span>
                    )}
                    {!isEditing && selectedNote.project_name && (
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        Learned while building:{" "}
                        <strong className="text-emerald-400">
                          {selectedNote.project_name}
                        </strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={cancelEditing}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#131b26] hover:bg-[#1c2738] text-slate-300 border border-[#243347] text-xs font-mono transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                        <button
                          onClick={saveEditing}
                          disabled={isSaving}
                          className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-semibold transition-colors shadow-xs"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSaving ? "Saving..." : "Save Note"}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(selectedNote)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-mono transition-colors"
                          title="Edit note"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteNote(selectedNote.id, selectedNote.title)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono transition-colors"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3 pt-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Note Title..."
                      className="w-full px-3.5 py-2 rounded-md bg-[#131b26] border border-[#243347] text-base font-bold font-mono text-slate-100 focus:outline-hidden focus:border-indigo-500"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={editProjectId}
                        onChange={(e) => setEditProjectId(e.target.value)}
                        className="px-3 py-1.5 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-300 font-mono focus:outline-hidden"
                      >
                        <option value="">No Project Assigned</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            Project: {p.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="Tags (comma separated)..."
                        className="px-3 py-1.5 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold font-mono text-slate-100">
                      {selectedNote.title}
                    </h2>
                    <div className="flex flex-wrap gap-1">
                      {selectedNote.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131b26] text-slate-400 border border-[#243347]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Note Content Viewer / Editor */}
              {isEditing ? (
                <textarea
                  rows={14}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Detailed engineering notes, concepts, code snippets..."
                  className="w-full p-4 rounded-lg bg-[#131b26] border border-[#243347] text-xs font-mono text-slate-200 placeholder-slate-500 leading-relaxed focus:outline-hidden focus:border-indigo-500"
                />
              ) : (
                <div className="prose prose-invert max-w-none text-xs leading-relaxed font-mono">
                  <pre className="p-4 rounded-lg bg-[#131b26] border border-[#243347] text-slate-200 whitespace-pre-wrap overflow-x-auto">
                    {selectedNote.content}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 font-mono">
              Select a note to view technical content.
            </div>
          )}
        </div>
      </div>

      {/* New Note Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#0e141f] border border-[#243347] rounded-xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase">
                Create Knowledge Note
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Topic / Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Linux Device Tree Basics for ARM64"
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-indigo-500 font-mono"
                  >
                    <option value="kernel">Linux Kernel</option>
                    <option value="embedded">Embedded Systems</option>
                    <option value="networking">Networking</option>
                    <option value="tooling">Compilers & Tooling</option>
                    <option value="general">General Systems</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Linked Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-indigo-500 font-mono"
                  >
                    <option value="">None (General Topic)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Markdown Content</label>
                <textarea
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write technical notes, device tree nodes, code snippets, or registers..."
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="device-tree, arm64, kernel"
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
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
                  className="px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold font-mono"
                >
                  {isSubmitting ? "Saving..." : "Save Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
