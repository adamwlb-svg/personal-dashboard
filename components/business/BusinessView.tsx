"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBusinessIdea, updateBusinessIdea, deleteBusinessIdea } from "@/app/business/actions";
import { BusinessChat } from "./BusinessChat";

export type SerializedIdea = {
  id: number;
  title: string;
  description: string | null;
  stage: string;
  tags: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type Message = { id: number; role: string; content: string; createdAt: string };

const STAGES = [
  { value: "idea",       label: "Idea",       emoji: "💡", color: "bg-amber-500/10 text-amber-400 border-amber-500/25",   dot: "bg-amber-400" },
  { value: "exploring",  label: "Exploring",  emoji: "🔍", color: "bg-blue-500/10 text-blue-400 border-blue-500/25",      dot: "bg-blue-400" },
  { value: "validating", label: "Validating", emoji: "✅", color: "bg-teal-500/10 text-teal-400 border-teal-500/25",      dot: "bg-teal-400" },
  { value: "building",   label: "Building",   emoji: "🚀", color: "bg-violet-500/10 text-violet-400 border-violet-500/25", dot: "bg-violet-400" },
  { value: "archived",   label: "Archived",   emoji: "📦", color: "bg-surface text-fg-3 border-surface-border",           dot: "bg-fg-3" },
];

function getStageMeta(value: string) {
  return STAGES.find((s) => s.value === value) ?? STAGES[0];
}

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(",").map((t) => t.trim()).filter(Boolean);
}

function SectionDivider({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-1 h-4 rounded-full flex-shrink-0 ${color}`} />
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-fg-3 flex-shrink-0">{label}</span>
      <div className="flex-1 h-px bg-surface-border" />
    </div>
  );
}

// ── Idea Modal ─────────────────────────────────────────────────────────────────

function IdeaModal({ idea, onClose }: { idea?: SerializedIdea | null; onClose: () => void }) {
  const router = useRouter();
  const isEditing = !!idea;

  const [title,       setTitle]       = useState(idea?.title       ?? "");
  const [description, setDescription] = useState(idea?.description ?? "");
  const [stage,       setStage]       = useState(idea?.stage       ?? "idea");
  const [tags,        setTags]        = useState(idea?.tags        ?? "");
  const [notes,       setNotes]       = useState(idea?.notes       ?? "");
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const data = { title: title.trim(), description: description.trim() || undefined, stage, tags: tags.trim() || undefined, notes: notes.trim() || undefined };
    if (isEditing) await updateBusinessIdea(idea.id, data);
    else           await createBusinessIdea(data);
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!idea) return;
    setDeleting(true);
    await deleteBusinessIdea(idea.id);
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-surface-raised border border-surface-border rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-base font-semibold text-fg">{isEditing ? "Edit Idea" : "New Idea"}</h2>
          <button onClick={onClose} className="text-fg-3 hover:text-fg-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <input
            type="text"
            placeholder="What's the idea?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-fg placeholder-fg-4 focus:outline-none focus:border-accent font-medium"
          />

          {/* Stage */}
          <div>
            <label className="text-xs text-fg-3 mb-2 block">Stage</label>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStage(s.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                    ${stage === s.value
                      ? "bg-accent/15 text-accent border-accent/40"
                      : "bg-surface border-surface-border text-fg-3 hover:border-gray-500"}`}
                >
                  <span>{s.emoji}</span> {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <textarea
            placeholder="Brief description — what problem does it solve? Who is the customer?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-fg placeholder-fg-4 focus:outline-none focus:border-accent text-sm resize-none"
          />

          {/* Tags */}
          <div>
            <label className="text-xs text-fg-3 mb-1 block">Tags <span className="text-fg-4">(comma-separated)</span></label>
            <input
              type="text"
              placeholder="e.g. B2B, SaaS, health, marketplace"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-fg placeholder-fg-4 focus:outline-none focus:border-accent text-sm"
            />
          </div>

          {/* Notes */}
          <textarea
            placeholder="Notes — research, feedback, open questions, next steps…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-fg placeholder-fg-4 focus:outline-none focus:border-accent text-sm resize-none"
          />

          <div className="flex items-center gap-2 pt-1">
            {isEditing && (
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors disabled:opacity-50">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-fg-2 hover:text-fg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || !title.trim()}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-fg transition-colors disabled:opacity-50">
              {saving ? "Saving…" : isEditing ? "Update" : "Add Idea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Idea Card ──────────────────────────────────────────────────────────────────

function IdeaCard({ idea, onEdit }: { idea: SerializedIdea; onEdit: () => void }) {
  const stage = getStageMeta(idea.stage);
  const tags  = parseTags(idea.tags);

  return (
    <button
      onClick={onEdit}
      className="group text-left bg-surface border border-surface-border rounded-xl p-4 hover:border-gray-600 transition-all hover:shadow-lg flex flex-col gap-3"
    >
      {/* Stage badge + title */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-fg leading-snug flex-1">{idea.title}</p>
        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${stage.color}`}>
          <span>{stage.emoji}</span> {stage.label}
        </span>
      </div>

      {/* Description */}
      {idea.description && (
        <p className="text-xs text-fg-3 leading-relaxed line-clamp-2">{idea.description}</p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-surface-border">
        <span className="text-[10px] text-fg-4">
          {new Date(idea.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
        <span className="text-[10px] text-fg-3 opacity-0 group-hover:opacity-100 transition-opacity">
          Click to edit →
        </span>
      </div>
    </button>
  );
}

// ── Main View ──────────────────────────────────────────────────────────────────

export function BusinessView({
  ideas,
  chatMessages,
  aiConfigured,
}: {
  ideas: SerializedIdea[];
  chatMessages: Message[];
  aiConfigured: boolean;
}) {
  const [modal,       setModal]       = useState<{ open: boolean; idea?: SerializedIdea | null }>({ open: false });
  const [stageFilter, setStageFilter] = useState<string>("all");

  const filteredIdeas = stageFilter === "all"
    ? ideas
    : ideas.filter((i) => i.stage === stageFilter);

  const counts = Object.fromEntries(STAGES.map((s) => [s.value, ideas.filter((i) => i.stage === s.value).length]));

  return (
    <>
      <div className="space-y-14">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-semibold text-fg">Business Ideas</h1>
          <p className="text-sm text-fg-2 mt-0.5">Brainstorm, track, and validate your startup ideas.</p>
        </div>

        {/* ── PIPELINE ──────────────────────────────────────────── */}
        <section className="space-y-5">
          <SectionDivider label="Pipeline" color="bg-indigo-400" />

          {/* Filter + Add */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setStageFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                  ${stageFilter === "all" ? "bg-accent/15 text-accent border-accent/40" : "bg-surface border-surface-border text-fg-3 hover:border-gray-500"}`}
              >
                All <span className="ml-1 opacity-60">{ideas.length}</span>
              </button>
              {STAGES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStageFilter(s.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                    ${stageFilter === s.value ? "bg-accent/15 text-accent border-accent/40" : "bg-surface border-surface-border text-fg-3 hover:border-gray-500"}`}
                >
                  {s.emoji} {s.label}
                  {counts[s.value] > 0 && <span className="opacity-60">{counts[s.value]}</span>}
                </button>
              ))}
            </div>
            <button
              onClick={() => setModal({ open: true, idea: null })}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-fg text-sm font-medium rounded-lg transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Idea
            </button>
          </div>

          {/* Ideas grid */}
          {filteredIdeas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-4xl mb-3">💡</p>
              <p className="text-base font-medium text-fg-2">
                {stageFilter === "all" ? "No ideas yet" : `No ideas in ${getStageMeta(stageFilter).label}`}
              </p>
              <p className="text-sm text-fg-3 mt-1 mb-6 max-w-xs">
                {stageFilter === "all"
                  ? "Add your first business idea, or ask the advisor below to help you find white space opportunities."
                  : "Move ideas from other stages or add a new one."}
              </p>
              <button
                onClick={() => setModal({ open: true, idea: null })}
                className="text-sm text-accent hover:underline"
              >
                Add your first idea →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onEdit={() => setModal({ open: true, idea })}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── ADVISOR ────────────────────────────────────────────── */}
        <section className="space-y-5">
          <SectionDivider label="Startup Advisor" color="bg-violet-400" />
          <div className="text-xs text-fg-3 -mt-1">
            Ask about white space opportunities, pressure-test your ideas, or get GTM strategy advice.
            The advisor has context on your idea pipeline above.
          </div>
          <BusinessChat initialMessages={chatMessages} aiConfigured={aiConfigured} />
        </section>
      </div>

      {modal.open && (
        <IdeaModal idea={modal.idea} onClose={() => setModal({ open: false })} />
      )}
    </>
  );
}
