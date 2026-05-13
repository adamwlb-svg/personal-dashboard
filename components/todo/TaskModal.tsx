"use client";

import { useState } from "react";
import {
  TODO_CATEGORIES,
  TodoCategoryKey,
  PRIORITIES,
  PriorityKey,
  SerializedTask,
  Subtask,
} from "@/lib/todo";
import { createTask, updateTask, deleteTask } from "@/app/todo/actions";
import { useRouter } from "next/navigation";

type Props = {
  task?: SerializedTask | Subtask | null;
  parentId?: number;
  defaultCategory?: string;
  onClose: () => void;
};

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function TaskModal({ task, parentId, defaultCategory, onClose }: Props) {
  const router = useRouter();
  const isEditing = !!task;

  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [dueDate, setDueDate] = useState(toDateInput(task?.dueDate ?? null));
  const [priority, setPriority] = useState<PriorityKey>(
    (task?.priority as PriorityKey) ?? "medium"
  );
  const [category, setCategory] = useState<TodoCategoryKey>(
    (task?.category as TodoCategoryKey) ??
      (defaultCategory as TodoCategoryKey) ??
      "personal"
  );
  const [addToCalendar, setAddToCalendar] = useState(
    isEditing ? !!task?.eventId : false
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    const data = {
      title: title.trim(),
      notes: notes.trim() || undefined,
      dueDate: dueDate || undefined,
      priority,
      category,
      parentId,
      addToCalendar: addToCalendar && !!dueDate,
    };

    if (isEditing) {
      await updateTask(task.id, data);
    } else {
      await createTask(data);
    }

    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!task) return;
    setDeleting(true);
    await deleteTask(task.id);
    router.refresh();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-surface-raised border border-surface-border rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-base font-semibold text-fg">
            {parentId ? "New Subtask" : isEditing ? "Edit Task" : "New Task"}
          </h2>
          <button
            onClick={onClose}
            className="text-fg-3 hover:text-fg-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-fg placeholder-gray-500 focus:outline-none focus:border-accent"
          />

          {/* Notes */}
          <textarea
            placeholder="Add notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-fg placeholder-gray-500 focus:outline-none focus:border-accent text-sm resize-none"
          />

          {/* Due date + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-fg-3 mb-1 block">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-fg text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs text-fg-3 mb-1 block">Priority</label>
              <div className="flex gap-1.5">
                {(Object.entries(PRIORITIES) as [PriorityKey, typeof PRIORITIES[PriorityKey]][]).map(
                  ([key, p]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPriority(key)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all
                        ${priority === key ? `${p.text} border-current bg-white/5` : "text-fg-3 border-surface-border hover:border-gray-500"}`}
                    >
                      {p.label}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Category */}
          {!parentId && (
            <div>
              <label className="text-xs text-fg-3 mb-2 block">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(TODO_CATEGORIES) as [TodoCategoryKey, typeof TODO_CATEGORIES[TodoCategoryKey]][]).map(
                  ([key, cat]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                        ${category === key ? `${cat.bg} ${cat.text} ${cat.border}` : "bg-surface border-surface-border text-fg-3 hover:border-gray-500"}`}
                    >
                      {cat.label}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Add to calendar */}
          {!parentId && dueDate && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                role="checkbox"
                aria-checked={addToCalendar}
                onClick={() => setAddToCalendar((v) => !v)}
                className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${addToCalendar ? "bg-accent" : "bg-surface-border"}`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${addToCalendar ? "translate-x-4" : "translate-x-0.5"}`}
                />
              </div>
              <span className="text-sm text-fg-2">Add to calendar</span>
            </label>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-fg-2 hover:text-fg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-fg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : isEditing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
