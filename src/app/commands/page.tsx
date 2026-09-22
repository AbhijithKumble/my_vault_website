"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Terminal,
  Plus,
  Copy,
  Check,
  Search,
  FolderGit2,
  X,
  Clock,
  Trash2,
  Edit3,
} from "lucide-react";

interface CommandItem {
  id: string;
  project_id: string;
  project_name: string;
  project_slug: string;
  command: string;
  explanation: string;
  category: string;
  tags: string[];
  last_used: string;
  created_at: string;
}

export default function CommandsPage() {
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form
  const [projectId, setProjectId] = useState("");
  const [command, setCommand] = useState("");
  const [explanation, setExplanation] = useState("");
  const [category, setCategory] = useState("kernel");
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editCommand, setEditCommand] = useState("");
  const [editExplanation, setEditExplanation] = useState("");
  const [editCategory, setEditCategory] = useState("kernel");
  const [editProjectId, setEditProjectId] = useState("");
  const [editTagInput, setEditTagInput] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const openEditModal = (cmd: CommandItem) => {
    setEditingId(cmd.id);
    setEditCommand(cmd.command);
    setEditExplanation(cmd.explanation || "");
    setEditCategory(cmd.category || "general");
    setEditProjectId(cmd.project_id || "");
    setEditTagInput((cmd.tags || []).join(", "));
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCommand.trim()) return;

    setIsSavingEdit(true);
    const tags = editTagInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      await fetch("/api/commands", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          command: editCommand,
          explanation: editExplanation,
          category: editCategory,
          project_id: editProjectId || null,
          tags,
        }),
      });
      setIsEditModalOpen(false);
      fetchCommands();
    } catch (err) {
      console.error("Failed to update command:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const fetchCommands = useCallback(() => {
    fetch("/api/commands")
      .then((res) => res.json())
      .then((data) => {
        setCommands(data.commands || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCommands();
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []));
  }, [fetchCommands]);

  const handleCopy = async (cmd: CommandItem) => {
    navigator.clipboard.writeText(cmd.command);
    setCopiedId(cmd.id);
    setTimeout(() => setCopiedId(null), 2000);

    // Update last_used
    await fetch("/api/commands", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cmd.id }),
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setIsSubmitting(true);
    const tags = tagInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      await fetch("/api/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId || null,
          command,
          explanation,
          category,
          tags,
        }),
      });
      setIsModalOpen(false);
      setCommand("");
      setExplanation("");
      setTagInput("");
      fetchCommands();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCommand = async (id: string) => {
    if (!confirm("Are you sure you want to delete this command?")) return;
    await fetch(`/api/commands?id=${id}`, { method: "DELETE" });
    fetchCommands();
  };

  const categories = [
    { id: "all", label: "All Commands" },
    { id: "kernel", label: "Linux Kernel" },
    { id: "android", label: "Android / Termux" },
    { id: "git", label: "Git Workflows" },
    { id: "embedded", label: "Embedded / Hardware" },
    { id: "general", label: "General Tooling" },
  ];

  const filtered = commands.filter((c) => {
    if (selectedCategory !== "all" && c.category !== selectedCategory) {
      return false;
    }
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      c.command.toLowerCase().includes(term) ||
      c.explanation?.toLowerCase().includes(term) ||
      c.category?.toLowerCase().includes(term) ||
      c.tags?.some((t) => t.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
            <Terminal className="w-4 h-4" />
            <span>COMMAND VAULT</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 font-mono mt-1">
            Reusable CLI Pipeline & Command Repository
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Store commands you don&apos;t want to forget with project associations and one-click copy.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold font-mono transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>NEW COMMAND</span>
        </button>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-[#1c2738] text-cyan-300 font-semibold border border-[#30425c]"
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
            placeholder="Search commands..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Commands List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-slate-500">
            Loading command vault...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-slate-500">
            No commands found.
          </div>
        ) : (
          filtered.map((cmd) => {
            const isCopied = copiedId === cmd.id;

            return (
              <div
                key={cmd.id}
                className="p-4 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-3 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1c2738] text-cyan-300 border border-[#2e405a]">
                      {cmd.category}
                    </span>
                    {cmd.project_name && (
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <FolderGit2 className="w-3 h-3 text-emerald-400" />
                        {cmd.project_name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {cmd.last_used && (
                      <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        used {cmd.last_used.split("T")[0]}
                      </span>
                    )}
                    <button
                      onClick={() => handleCopy(cmd)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                        isCopied
                          ? "bg-emerald-600 text-white"
                          : "bg-[#1c2738] hover:bg-[#243347] text-slate-300"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>COPY</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(cmd)}
                      className="text-slate-500 hover:text-cyan-400 p-1 rounded hover:bg-[#1c2738] transition-colors"
                      title="Edit command"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
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

                {/* Command Box */}
                <pre className="p-3 rounded-lg bg-[#090d16] border border-[#1e293b] text-xs font-mono text-cyan-300 overflow-x-auto whitespace-pre-wrap">
                  {cmd.command}
                </pre>

                {/* Explanation & Tags */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <p className="text-slate-300 font-mono">{cmd.explanation}</p>
                  <div className="flex flex-wrap gap-1 shrink-0">
                    {cmd.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#131b26] text-slate-400 border border-[#243347]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Command Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-[#0e141f] border border-[#243347] rounded-xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase">
                Save Command / Snippet
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
                <label className="text-xs font-mono text-slate-300">Command String *</label>
                <textarea
                  rows={2}
                  required
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- bcm2712_defconfig"
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Explanation</label>
                <input
                  type="text"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Cross-compilation pipeline for RPi 5 kernel"
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-cyan-500 font-mono"
                  >
                    <option value="kernel">Linux Kernel</option>
                    <option value="android">Android / Termux</option>
                    <option value="git">Git</option>
                    <option value="embedded">Embedded</option>
                    <option value="ros">ROS / Robotics</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Associated Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-cyan-500 font-mono"
                  >
                    <option value="">None (General)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="make, rpi, kernel, build"
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 font-mono"
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
                  className="px-4 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold font-mono"
                >
                  {isSubmitting ? "Saving..." : "Save Command"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Command Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-[#0e141f] border border-[#1e293b] p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold font-mono text-slate-100 uppercase">
                  Edit Command
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
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Command (Shell / GDB / Git)</label>
                <textarea
                  required
                  rows={3}
                  value={editCommand}
                  onChange={(e) => setEditCommand(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-cyan-300 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Explanation / When to Use</label>
                <input
                  type="text"
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-cyan-500 font-mono"
                  >
                    <option value="kernel">Kernel & Drivers</option>
                    <option value="embedded">Embedded / Flash</option>
                    <option value="git">Git & Worktrees</option>
                    <option value="android">Android / Termux</option>
                    <option value="general">General Tools</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Associated Project</label>
                  <select
                    value={editProjectId}
                    onChange={(e) => setEditProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-cyan-500 font-mono"
                  >
                    <option value="">None (General)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Tags (comma separated)</label>
                <input
                  type="text"
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  placeholder="make, rpi, kernel, build"
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 font-mono"
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
                  className="px-4 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold font-mono"
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
