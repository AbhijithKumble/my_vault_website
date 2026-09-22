"use client";

import { useEffect, useState, useCallback } from "react";
import { Cpu, Plus, FolderGit2, X, Wrench, CheckCircle2, AlertTriangle, Trash2, Edit3 } from "lucide-react";

interface HardwareItem {
  id: string;
  name: string;
  specs: string;
  status: "working" | "experimental" | "maintenance" | "archived";
  project_ids: string[];
  projects: Array<{ id: string; name: string; slug: string }>;
  notes: string;
  created_at: string;
}

export default function HardwarePage() {
  const [hardware, setHardware] = useState<HardwareItem[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form
  const [name, setName] = useState("");
  const [specs, setSpecs] = useState("");
  const [status, setStatus] = useState<any>("working");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");
  const [editSpecs, setEditSpecs] = useState("");
  const [editStatus, setEditStatus] = useState<any>("working");
  const [editSelectedProjects, setEditSelectedProjects] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const openEditModal = (item: HardwareItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditSpecs(item.specs || "");
    setEditStatus(item.status);
    setEditSelectedProjects(item.project_ids || []);
    setEditNotes(item.notes || "");
    setIsEditModalOpen(true);
  };

  const toggleEditProject = (id: string) => {
    setEditSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setIsSavingEdit(true);
    try {
      await fetch("/api/hardware", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          name: editName,
          specs: editSpecs,
          status: editStatus,
          project_ids: editSelectedProjects,
          notes: editNotes,
        }),
      });
      setIsEditModalOpen(false);
      fetchHardware();
    } catch (err) {
      console.error("Failed to update hardware:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const fetchHardware = useCallback(() => {
    fetch("/api/hardware")
      .then((res) => res.json())
      .then((data) => {
        setHardware(data.hardware || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchHardware();
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []));
  }, [fetchHardware]);

  const handleDeleteHardware = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete hardware device "${name}"?`)) return;
    try {
      await fetch(`/api/hardware?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      fetchHardware();
    } catch (err) {
      console.error("Failed to delete hardware:", err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await fetch("/api/hardware", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          specs,
          status,
          project_ids: selectedProjects,
          notes,
        }),
      });
      setIsModalOpen(false);
      setName("");
      setSpecs("");
      setSelectedProjects([]);
      setNotes("");
      fetchHardware();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleProject = (id: string) => {
    setSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case "working":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "experimental":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "maintenance":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold tracking-wider uppercase">
            <Cpu className="w-4 h-4" />
            <span>PHYSICAL COMPUTING INVENTORY</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 font-mono mt-1">
            Hardware & Lab Devices
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track boards, dev kits, pinouts, serial adapters, and attached projects.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold font-mono transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>REGISTER HARDWARE</span>
        </button>
      </div>

      {/* Hardware Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs font-mono text-slate-500">
            Loading hardware inventory...
          </div>
        ) : hardware.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs font-mono text-slate-500">
            No hardware devices registered yet. Register your first board above.
          </div>
        ) : (
          hardware.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-xl bg-[#0e141f] border border-[#1e293b] flex flex-col justify-between space-y-4 hover:border-slate-600 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-bold font-mono text-slate-100">
                    {item.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${statusBadge(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1 rounded text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      title="Edit Hardware"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteHardware(item.id, item.name)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Hardware"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {item.specs && (
                  <pre className="p-3 rounded-lg bg-[#131b26] border border-[#243347] text-xs font-mono text-slate-300 whitespace-pre-wrap">
                    {item.specs}
                  </pre>
                )}

                {item.notes && (
                  <p className="text-xs text-slate-400 font-mono">
                    {item.notes}
                  </p>
                )}
              </div>

              {/* Connected Projects */}
              <div className="pt-3 border-t border-[#1e293b] space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-slate-500">
                  Assigned To Projects:
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.projects && item.projects.length > 0 ? (
                    item.projects.map((p) => (
                      <span
                        key={p.id}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131b26] text-emerald-400 border border-[#243347] flex items-center gap-1"
                      >
                        <FolderGit2 className="w-3 h-3" />
                        {p.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-500 italic font-mono">
                      Not currently assigned to a project
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Register Modal */}
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
                Register Device / Board
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
                <label className="text-xs font-mono text-slate-300">Device Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Raspberry Pi 5 (4GB), Lenovo Tab M7, ESP32-WROOM"
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Specifications & OS</label>
                <textarea
                  rows={3}
                  value={specs}
                  onChange={(e) => setSpecs(e.target.value)}
                  placeholder="├── 4 GB LPDDR4X&#10;├── OS: Debian Bookworm 64-bit&#10;└── Kernel: 6.6.20-v8-16k"
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono whitespace-pre"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Operational Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                >
                  <option value="working">🟢 Working</option>
                  <option value="experimental">🟡 Experimental</option>
                  <option value="maintenance">🔴 Maintenance</option>
                  <option value="archived">⚪ Archived</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Associated Projects</label>
                <div className="flex flex-wrap gap-2">
                  {projects.map((p) => {
                    const isSelected = selectedProjects.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => toggleProject(p.id)}
                        className={`px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-[#131b26] text-slate-400 border-[#243347]"
                        }`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Notes & Wiring Details</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="UART hooked to GPIO 14/15, baud rate 115200"
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
                  {isSubmitting ? "Registering..." : "Register Device"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hardware Modal */}
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
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold font-mono text-slate-100 uppercase">
                  Edit Hardware Device
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
                <label className="text-xs font-mono text-slate-300">Device / Board Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Operational Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                  >
                    <option value="working">working</option>
                    <option value="experimental">experimental</option>
                    <option value="maintenance">maintenance</option>
                    <option value="archived">archived</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Notes & Wiring Details</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Specifications / Pinouts</label>
                <textarea
                  rows={4}
                  value={editSpecs}
                  onChange={(e) => setEditSpecs(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Attached Projects</label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-md bg-[#131b26] border border-[#243347] max-h-32 overflow-y-auto">
                  {projects.map((p) => {
                    const isSelected = editSelectedProjects.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => toggleEditProject(p.id)}
                        className={`px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-[#131b26] text-slate-400 border-[#243347]"
                        }`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
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
