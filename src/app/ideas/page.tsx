"use client";

import { useEffect, useState, useCallback } from "react";
import { Lightbulb, Plus, ArrowRight, Check, X, Archive, Sparkles, Trash2, Edit3 } from "lucide-react";

interface Idea {
  id: string;
  title: string;
  notes: string;
  status: "inbox" | "evaluated" | "converted" | "archived";
  created_at: string;
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [loading, setLoading] = useState(true);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<"inbox" | "evaluated" | "converted" | "archived">("inbox");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const openEditModal = (idea: Idea) => {
    setEditingId(idea.id);
    setEditTitle(idea.title);
    setEditNotes(idea.notes || "");
    setEditStatus(idea.status);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    setIsSavingEdit(true);
    try {
      await fetch("/api/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          title: editTitle,
          notes: editNotes,
          status: editStatus,
        }),
      });
      setIsEditModalOpen(false);
      fetchIdeas();
    } catch (err) {
      console.error("Failed to update idea:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const fetchIdeas = useCallback(() => {
    fetch("/api/ideas")
      .then((res) => res.json())
      .then((data) => {
        setIdeas(data.ideas || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleAddIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, notes: newNotes }),
    });

    setNewTitle("");
    setNewNotes("");
    fetchIdeas();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/ideas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchIdeas();
  };

  const convertToProject = async (idea: Idea) => {
    // 1. Create project
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: idea.title,
        goal: idea.notes || idea.title,
        status: "active",
      }),
    });
    // 2. Mark idea as converted
    await updateStatus(idea.id, "converted");
  };

  const handleDeleteIdea = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete idea "${title}"?`)) return;
    try {
      await fetch(`/api/ideas?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      fetchIdeas();
    } catch (err) {
      console.error("Failed to delete idea:", err);
    }
  };

  const activeIdeas = ideas.filter((i) => i.status === "inbox" || i.status === "evaluated");
  const completedOrConverted = ideas.filter((i) => i.status === "converted" || i.status === "archived");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-semibold tracking-wider uppercase">
            <Lightbulb className="w-4 h-4" />
            <span>INCUBATION BUFFER</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 font-mono mt-1">
            Ideas Inbox
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Filter impulse ideas: Idea → Interesting? → Worth building? → Convert to Project.
          </p>
        </div>
      </div>

      {/* Quick Add Form */}
      <form
        onSubmit={handleAddIdea}
        className="p-4 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-3"
      >
        <div className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Rapid Idea Capture
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g., Build a tiny bootloader, Write userspace USB analyzer..."
            className="flex-1 px-3.5 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
          />
          <input
            type="text"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Optional context / motivation..."
            className="sm:w-1/3 px-3.5 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-mono shrink-0 transition-colors"
          >
            Capture Idea
          </button>
        </div>
      </form>

      {/* Active Ideas Matrix */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
          Active Candidates ({activeIdeas.length})
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs font-mono text-slate-500">
            Loading ideas...
          </div>
        ) : activeIdeas.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">
            No ideas in inbox. Capture your thoughts above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeIdeas.map((idea) => (
              <div
                key={idea.id}
                className="p-4 rounded-xl bg-[#0e141f] border border-[#1e293b] flex flex-col justify-between space-y-3 hover:border-slate-600 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold font-mono text-slate-100">
                      → {idea.title}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131b26] text-amber-300 border border-[#243347]">
                        {idea.status}
                      </span>
                      <button
                        onClick={() => openEditModal(idea)}
                        className="p-1 rounded text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                        title="Edit Idea"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteIdea(idea.id, idea.title)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Idea"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {idea.notes && (
                    <p className="text-xs text-slate-400 mt-1.5 font-mono">
                      {idea.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1e293b] text-xs font-mono">
                  <span className="text-[10px] text-slate-500">
                    {idea.created_at.split("T")[0]}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateStatus(idea.id, "archived")}
                      className="px-2 py-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1c2738] transition-colors"
                      title="Archive"
                    >
                      Archive
                    </button>
                    <button
                      onClick={() => convertToProject(idea)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors font-semibold"
                    >
                      <span>Promote to Project</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Converted & Archived */}
        {completedOrConverted.length > 0 && (
          <div className="pt-6 border-t border-[#1e293b] space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Converted to Projects / Archived
            </h3>
            <div className="space-y-2">
              {completedOrConverted.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-[#0a0e17] border border-[#1e293b] flex items-center justify-between text-xs font-mono"
                >
                  <span className="text-slate-400 line-through">
                    {item.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase">
                      {item.status}
                    </span>
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1 rounded text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                      title="Edit Idea"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteIdea(item.id, item.title)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Idea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Idea Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-[#0e141f] border border-[#1e293b] p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold font-mono text-slate-100 uppercase">
                  Edit Idea
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
                <label className="text-xs font-mono text-slate-300">Idea Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Context / Notes</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-amber-500 font-mono"
                >
                  <option value="inbox">inbox</option>
                  <option value="evaluated">evaluated</option>
                  <option value="converted">converted</option>
                  <option value="archived">archived</option>
                </select>
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
                  className="px-4 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-mono"
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
