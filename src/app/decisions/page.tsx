"use client";

import { useEffect, useState, useCallback } from "react";
import { Scale, Plus, FolderGit2, X, Clock, HelpCircle, ArrowRight, Trash2, Edit3 } from "lucide-react";

interface DecisionItem {
  id: string;
  dec_number: number;
  project_id: string;
  project_name: string;
  project_slug: string;
  decision: string;
  alternatives: string;
  why: string;
  assumptions: string;
  expected_result: string;
  revisit_date: string;
  outcome_assessment: string;
  created_at: string;
}

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form
  const [projectId, setProjectId] = useState("");
  const [decision, setDecision] = useState("");
  const [alternatives, setAlternatives] = useState("");
  const [why, setWhy] = useState("");
  const [assumptions, setAssumptions] = useState("");
  const [expectedResult, setExpectedResult] = useState("");
  const [revisitDate, setRevisitDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editProjectId, setEditProjectId] = useState("");
  const [editDecision, setEditDecision] = useState("");
  const [editAlternatives, setEditAlternatives] = useState("");
  const [editWhy, setEditWhy] = useState("");
  const [editAssumptions, setEditAssumptions] = useState("");
  const [editExpectedResult, setEditExpectedResult] = useState("");
  const [editRevisitDate, setEditRevisitDate] = useState("");
  const [editOutcomeAssessment, setEditOutcomeAssessment] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const openEditModal = (dec: DecisionItem) => {
    setEditingId(dec.id);
    setEditProjectId(dec.project_id || "");
    setEditDecision(dec.decision);
    setEditAlternatives(dec.alternatives || "");
    setEditWhy(dec.why || "");
    setEditAssumptions(dec.assumptions || "");
    setEditExpectedResult(dec.expected_result || "");
    setEditRevisitDate(dec.revisit_date || "");
    setEditOutcomeAssessment(dec.outcome_assessment || "");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDecision.trim()) return;

    setIsSavingEdit(true);
    try {
      await fetch("/api/decisions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          project_id: editProjectId || null,
          decision: editDecision,
          alternatives: editAlternatives,
          why: editWhy,
          assumptions: editAssumptions,
          expected_result: editExpectedResult,
          revisit_date: editRevisitDate,
          outcome_assessment: editOutcomeAssessment,
        }),
      });
      setIsEditModalOpen(false);
      fetchDecisions();
    } catch (err) {
      console.error("Failed to update decision:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const fetchDecisions = useCallback(() => {
    fetch("/api/decisions")
      .then((res) => res.json())
      .then((data) => {
        setDecisions(data.decisions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDecisions();
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []));
  }, [fetchDecisions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision.trim()) return;

    setIsSubmitting(true);
    try {
      await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId || null,
          decision,
          alternatives,
          why,
          assumptions,
          expected_result: expectedResult,
          revisit_date: revisitDate,
        }),
      });
      setIsModalOpen(false);
      setDecision("");
      setAlternatives("");
      setWhy("");
      setAssumptions("");
      setExpectedResult("");
      setRevisitDate("");
      fetchDecisions();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDecision = async (id: string, num: number) => {
    if (!confirm(`Are you sure you want to delete DECISION #${num}?`)) return;
    await fetch(`/api/decisions?id=${id}`, { method: "DELETE" });
    fetchDecisions();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-semibold tracking-wider uppercase">
            <Scale className="w-4 h-4" />
            <span>ARCHITECTURAL JUDGMENT</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 font-mono mt-1">
            Engineering Decision Journal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Record key architectural decisions: alternatives considered, rationale, assumptions, and revisit reviews.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold font-mono transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>RECORD DECISION</span>
        </button>
      </div>

      {/* Decisions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-slate-500">
            Loading decisions...
          </div>
        ) : decisions.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-slate-500">
            No architectural decisions recorded yet.
          </div>
        ) : (
          decisions.map((dec) => (
            <div
              key={dec.id}
              className="p-5 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-bold text-purple-400">
                    DECISION #{dec.dec_number.toString().padStart(3, "0")}
                  </span>
                  {dec.project_name && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <FolderGit2 className="w-3 h-3" />
                      {dec.project_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {dec.revisit_date && (
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Revisit: {dec.revisit_date}
                    </div>
                  )}
                  <button
                    onClick={() => openEditModal(dec)}
                    className="text-slate-500 hover:text-purple-400 p-1 rounded hover:bg-[#1c2738] transition-colors"
                    title="Edit decision"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDecision(dec.id, dec.dec_number)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-[#1c2738] transition-colors"
                    title="Delete decision"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-100">
                  {dec.decision}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-lg bg-[#131b26] border border-[#243347] space-y-1">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">
                    Alternatives Considered:
                  </div>
                  <div className="text-slate-300 whitespace-pre-wrap">{dec.alternatives || "None"}</div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#131b26] border border-[#243347] space-y-1">
                  <div className="text-[10px] uppercase text-purple-400 font-semibold">
                    Why Chosen:
                  </div>
                  <div className="text-slate-300 whitespace-pre-wrap">{dec.why}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#111722] border border-[#1e293b] space-y-1">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">
                    Assumptions:
                  </div>
                  <div className="text-slate-300">{dec.assumptions || "None specified"}</div>
                </div>

                <div className="p-3 rounded-lg bg-[#111722] border border-[#1e293b] space-y-1">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">
                    Expected Result:
                  </div>
                  <div className="text-slate-300">{dec.expected_result || "N/A"}</div>
                </div>
              </div>

              {dec.outcome_assessment && (
                <div className="p-3.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs font-mono space-y-1">
                  <div className="text-[10px] uppercase text-emerald-400 font-semibold">
                    Post-Mortem / Outcome Review:
                  </div>
                  <div className="text-slate-200">{dec.outcome_assessment}</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Decision Modal */}
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
                Record Engineering Decision
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
                <label className="text-xs font-mono text-slate-300">Decision Statement *</label>
                <input
                  type="text"
                  required
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  placeholder="Use SSH rather than HTTP for the first version of the ARM build server"
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Associated Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-purple-500 font-mono"
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
                  <label className="text-xs font-mono text-slate-300">Revisit Date / Milestone</label>
                  <input
                    type="text"
                    value={revisitDate}
                    onChange={(e) => setRevisitDate(e.target.value)}
                    placeholder="After first end-to-end prototype"
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Alternatives Considered</label>
                <textarea
                  rows={2}
                  value={alternatives}
                  onChange={(e) => setAlternatives(e.target.value)}
                  placeholder="- SSH&#10;- REST API / FastAPI&#10;- gRPC"
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-purple-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Why was this option selected?</label>
                <textarea
                  rows={2}
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                  placeholder="SSH requires zero extra server daemons on the Android target..."
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-purple-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Assumptions</label>
                  <input
                    type="text"
                    value={assumptions}
                    onChange={(e) => setAssumptions(e.target.value)}
                    placeholder="Target maintains stable WiFi IP"
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-purple-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Expected Result</label>
                  <input
                    type="text"
                    value={expectedResult}
                    onChange={(e) => setExpectedResult(e.target.value)}
                    placeholder="Working prototype in 1 day"
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-purple-500 font-mono"
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
                  className="px-4 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold font-mono"
                >
                  {isSubmitting ? "Recording..." : "Save Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Decision Modal */}
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
                <Edit3 className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold font-mono text-slate-100 uppercase">
                  Edit Decision
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
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-purple-500 font-mono"
                  >
                    <option value="">None (General Architecture)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Revisit Review Date</label>
                  <input
                    type="date"
                    value={editRevisitDate}
                    onChange={(e) => setEditRevisitDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">
                  Decision Made <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editDecision}
                  onChange={(e) => setEditDecision(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-purple-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Alternatives Considered</label>
                <textarea
                  rows={2}
                  value={editAlternatives}
                  onChange={(e) => setEditAlternatives(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-purple-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Why Chosen (Rationale)</label>
                <textarea
                  rows={2}
                  value={editWhy}
                  onChange={(e) => setEditWhy(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-purple-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Assumptions</label>
                  <input
                    type="text"
                    value={editAssumptions}
                    onChange={(e) => setEditAssumptions(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-purple-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Expected Result</label>
                  <input
                    type="text"
                    value={editExpectedResult}
                    onChange={(e) => setEditExpectedResult(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-emerald-400 font-semibold">
                  Outcome Review / Post-Mortem Assessment
                </label>
                <textarea
                  rows={2}
                  value={editOutcomeAssessment}
                  onChange={(e) => setEditOutcomeAssessment(e.target.value)}
                  placeholder="Was this decision correct? What held up? What failed?"
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-emerald-500/40 text-xs text-emerald-300 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono"
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
                  className="px-4 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold font-mono"
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
