"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FlaskConical,
  Plus,
  Terminal,
  FolderGit2,
  X,
  Search,
  Trash2,
  Edit3,
} from "lucide-react";

interface Experiment {
  id: string;
  exp_number: number;
  project_id: string;
  project_name: string;
  project_slug: string;
  question: string;
  hypothesis: string;
  setup: string;
  command: string;
  result: string;
  observation: string;
  conclusion: string;
  next_experiment: string;
  tags: string[];
  created_at: string;
}

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Form State
  const [projectId, setProjectId] = useState("");
  const [question, setQuestion] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [setup, setSetup] = useState("");
  const [command, setCommand] = useState("");
  const [result, setResult] = useState("");
  const [observation, setObservation] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [nextExperiment, setNextExperiment] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editProjectId, setEditProjectId] = useState("");
  const [editQuestion, setEditQuestion] = useState("");
  const [editHypothesis, setEditHypothesis] = useState("");
  const [editSetup, setEditSetup] = useState("");
  const [editCommand, setEditCommand] = useState("");
  const [editResult, setEditResult] = useState("");
  const [editObservation, setEditObservation] = useState("");
  const [editConclusion, setEditConclusion] = useState("");
  const [editNextExperiment, setEditNextExperiment] = useState("");
  const [editTagInput, setEditTagInput] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const openEditModal = (exp: Experiment) => {
    setEditingId(exp.id);
    setEditProjectId(exp.project_id || "");
    setEditQuestion(exp.question);
    setEditHypothesis(exp.hypothesis || "");
    setEditSetup(exp.setup || "");
    setEditCommand(exp.command || "");
    setEditResult(exp.result || "");
    setEditObservation(exp.observation || "");
    setEditConclusion(exp.conclusion || "");
    setEditNextExperiment(exp.next_experiment || "");
    setEditTagInput((exp.tags || []).join(", "));
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editQuestion.trim()) return;

    setIsSavingEdit(true);
    const tags = editTagInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      await fetch("/api/experiments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          project_id: editProjectId || null,
          question: editQuestion,
          hypothesis: editHypothesis,
          setup: editSetup,
          command: editCommand,
          result: editResult,
          observation: editObservation,
          conclusion: editConclusion,
          next_experiment: editNextExperiment,
          tags,
        }),
      });
      setIsEditModalOpen(false);
      fetchExperiments();
    } catch (err) {
      console.error("Failed to update experiment:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const fetchExperiments = useCallback(() => {
    fetch("/api/experiments")
      .then((res) => res.json())
      .then((data) => {
        setExperiments(data.experiments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchExperiments();
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []));
  }, [fetchExperiments]);

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsSubmitting(true);
    const tags = tagInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId || null,
          question,
          hypothesis,
          setup,
          command,
          result,
          observation,
          conclusion,
          next_experiment: nextExperiment,
          tags,
        }),
      });
      setIsModalOpen(false);
      // Reset form
      setQuestion("");
      setHypothesis("");
      setSetup("");
      setCommand("");
      setResult("");
      setObservation("");
      setConclusion("");
      setNextExperiment("");
      setTagInput("");
      fetchExperiments();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExperiment = async (id: string, num: number) => {
    if (!confirm(`Are you sure you want to delete EXPERIMENT #${num}?`)) return;
    await fetch(`/api/experiments?id=${id}`, { method: "DELETE" });
    fetchExperiments();
  };

  const filtered = experiments.filter((e) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      e.question.toLowerCase().includes(term) ||
      e.hypothesis?.toLowerCase().includes(term) ||
      e.result?.toLowerCase().includes(term) ||
      e.conclusion?.toLowerCase().includes(term) ||
      e.project_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-semibold tracking-wider uppercase">
            <FlaskConical className="w-4 h-4" />
            <span>EMPIRICAL LAB NOTEBOOK</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 font-mono mt-1">
            Technical Experiment Tracker
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Distinguish: I think X → I tested X with command Y → X happened.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-mono transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>LOG EXPERIMENT</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search experiments by question, setup, or conclusion..."
          className="w-full pl-9 pr-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden"
        />
      </div>

      {/* Experiments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-slate-500">
            Loading experiments...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-slate-500">
            No experiments found. Start your first experiment log above!
          </div>
        ) : (
          filtered.map((exp) => (
            <div
              key={exp.id}
              className="p-5 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-bold text-amber-400">
                    EXPERIMENT #{exp.exp_number.toString().padStart(3, "0")}
                  </span>
                  {exp.project_name && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <FolderGit2 className="w-3 h-3" />
                      {exp.project_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-wrap gap-1">
                    {exp.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#131b26] text-slate-400 border border-[#243347]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => openEditModal(exp)}
                    className="text-slate-500 hover:text-amber-400 p-1 rounded hover:bg-[#1c2738] transition-colors"
                    title="Edit experiment"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteExperiment(exp.id, exp.exp_number)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-[#1c2738] transition-colors"
                    title="Delete experiment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Question */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Question:
                </div>
                <h2 className="text-base font-semibold text-slate-100 mt-0.5">
                  {exp.question}
                </h2>
              </div>

              {/* Hypothesis & Setup */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#131b26] border border-[#243347] space-y-1">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">
                    Hypothesis:
                  </div>
                  <div className="text-slate-300">
                    {exp.hypothesis || "No hypothesis stated"}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#131b26] border border-[#243347] space-y-1">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">
                    Hardware / Software Setup:
                  </div>
                  <div className="text-slate-300">
                    {exp.setup || "Default setup"}
                  </div>
                </div>
              </div>

              {/* Terminal Command */}
              {exp.command && (
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Terminal className="w-3 h-3" /> Execution Command:
                  </div>
                  <pre className="p-3 rounded-md bg-[#090d16] border border-[#1e293b] text-xs font-mono text-emerald-300 overflow-x-auto">
                    $ {exp.command}
                  </pre>
                </div>
              )}

              {/* Result & Observation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#131b26] border border-[#243347] space-y-1">
                  <div className="text-[10px] uppercase text-amber-400 font-semibold">
                    Observed Result:
                  </div>
                  <div className="text-slate-200">{exp.result}</div>
                </div>

                <div className="p-3 rounded-lg bg-[#131b26] border border-[#243347] space-y-1">
                  <div className="text-[10px] uppercase text-blue-400 font-semibold">
                    Engineering Conclusion:
                  </div>
                  <div className="text-slate-200">{exp.conclusion}</div>
                </div>
              </div>

              {/* Next Experiment */}
              {exp.next_experiment && (
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs font-mono flex items-center justify-between">
                  <span className="text-emerald-400 font-semibold">
                    Next Experiment:
                  </span>
                  <span className="text-slate-200">{exp.next_experiment}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Experiment Modal */}
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
                Log New Engineering Experiment
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExperiment} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Associated Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-amber-500"
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
                    placeholder="arm, benchmark, ccache"
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Question / Problem *</label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Can the Tab M7 compile a medium-sized C project within acceptable time?"
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Hypothesis</label>
                <textarea
                  rows={2}
                  value={hypothesis}
                  onChange={(e) => setHypothesis(e.target.value)}
                  placeholder="A 4-core Cortex-A53 can build SQLite in under 2 minutes..."
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Setup</label>
                <input
                  type="text"
                  value={setup}
                  onChange={(e) => setSetup(e.target.value)}
                  placeholder="Android 10 + Termux, 4 cores, 2GB RAM"
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Execution Command</label>
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="time make -j4"
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Result</label>
                  <textarea
                    rows={2}
                    value={result}
                    onChange={(e) => setResult(e.target.value)}
                    placeholder="Build finished in 1m 48s..."
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Conclusion</label>
                  <textarea
                    rows={2}
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    placeholder="Viable for medium builds. Need ccache..."
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Next Experiment</label>
                <input
                  type="text"
                  value={nextExperiment}
                  onChange={(e) => setNextExperiment(e.target.value)}
                  placeholder="Try ccache..."
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
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
                  className="px-4 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-mono"
                >
                  {isSubmitting ? "Logging..." : "Save Experiment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Experiment Modal */}
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
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold font-mono text-slate-100 uppercase">
                  Edit Experiment
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
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 focus:outline-hidden focus:border-amber-500 font-mono"
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
                    placeholder="termux, arm, kernel, speed"
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">
                  Question <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Hypothesis</label>
                  <textarea
                    rows={2}
                    value={editHypothesis}
                    onChange={(e) => setEditHypothesis(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Setup / Environment</label>
                  <textarea
                    rows={2}
                    value={editSetup}
                    onChange={(e) => setEditSetup(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Command Executed</label>
                <input
                  type="text"
                  value={editCommand}
                  onChange={(e) => setEditCommand(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-amber-300 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Result</label>
                  <textarea
                    rows={2}
                    value={editResult}
                    onChange={(e) => setEditResult(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Observation</label>
                  <textarea
                    rows={2}
                    value={editObservation}
                    onChange={(e) => setEditObservation(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Conclusion</label>
                  <textarea
                    rows={2}
                    value={editConclusion}
                    onChange={(e) => setEditConclusion(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Next Experiment</label>
                  <input
                    type="text"
                    value={editNextExperiment}
                    onChange={(e) => setEditNextExperiment(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#131b26] border border-[#243347] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
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
