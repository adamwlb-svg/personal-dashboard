"use client";

import { useState } from "react";
import {
  TODO_CATEGORIES,
  TodoCategoryKey,
  PRIORITIES,
  PriorityKey,
  SerializedTask,
  Subtask,
  isOverdue,
  formatDueDate,
} from "@/lib/todo";
import { toggleComplete } from "@/app/todo/actions";
import { useRouter } from "next/navigation";
import { TaskModal } from "./TaskModal";

type Props = {
  task: SerializedTask;
};

function SubtaskRow({ subtask, onEdit }: { subtask: Subtask; onEdit: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const cat = TODO_CATEGORIES[subtask.category as TodoCategoryKey] ?? TODO_CATEGORIES.personal;
  const overdue = isOverdue(subtask.dueDate);

  async function handleToggle() {
    setPending(true);
    await toggleComplete(subtask.id, !subtask.completed);
    router.refresh();
    setPending(false);
  }

  return (
    <div className="flex items-center gap-2 pl-8 py-1.5 group">
      <button
        onClick={handleToggle}
        disabled={pending}
        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors
          ${subtask.completed ? "bg-accent border-accent" : "border-gray-600 hover:border-accent"}`}
      >
        {subtask.completed && (
          <svg className="w-2.5 h-2.5 text-fg mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <span
        className={`text-sm flex-1 ${subtask.completed ? "line-through text-fg-3" : "text-fg-2"}`}
      >
        {subtask.emoji && <span className="mr-1">{subtask.emoji}</span>}
        {subtask.title}
      </span>
      {subtask.dueDate && (
        <span className={`text-xs ${overdue && !subtask.completed ? "text-red-400" : "text-fg-3"}`}>
          {formatDueDate(subtask.dueDate)}
        </span>
      )}
      <button
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 text-fg-3 hover:text-fg-2 transition-all p-0.5"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  );
}

export function TaskItem({ task }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; subtask?: Subtask; addSubtask?: boolean }>({
    open: false,
  });

  const cat = TODO_CATEGORIES[task.category as TodoCategoryKey] ?? TODO_CATEGORIES.personal;
  const pri = PRIORITIES[task.priority as PriorityKey] ?? PRIORITIES.medium;
  const overdue = isOverdue(task.dueDate);
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

  async function handleToggle() {
    setPending(true);
    await toggleComplete(task.id, !task.completed);
    router.refresh();
    setPending(false);
  }

  return (
    <>
      <div className="bg-surface-raised border border-surface-border rounded-xl overflow-hidden">
        {/* Main row */}
        <div className="flex items-center gap-3 px-4 py-3 group">
          {/* Checkbox */}
          <button
            onClick={handleToggle}
            disabled={pending}
            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
              ${task.completed ? "bg-accent border-accent" : "border-gray-600 hover:border-accent"}`}
          >
            {task.completed && (
              <svg className="w-3 h-3 text-fg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Priority dot */}
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pri.dot}`} />

          {/* Emoji */}
          {task.emoji && (
            <span className="text-base flex-shrink-0">{task.emoji}</span>
          )}

          {/* Title + meta */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${task.completed ? "line-through text-fg-3" : "text-fg"}`}>
              {task.title}
              {task.eventId && (
                <span className="ml-1.5 text-xs text-accent opacity-70">⟶ calendar</span>
              )}
            </p>
            {task.notes && !task.completed && (
              <p className="text-xs text-fg-3 truncate mt-0.5">{task.notes}</p>
            )}
          </div>

          {/* Due date */}
          {task.dueDate && (
            <span
              className={`text-xs flex-shrink-0 px-2 py-0.5 rounded-full
                ${overdue && !task.completed ? "bg-red-500/15 text-red-400" : "bg-surface text-fg-3"}`}
            >
              {formatDueDate(task.dueDate)}
            </span>
          )}

          {/* Category badge */}
          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${cat.bg} ${cat.text}`}>
            {cat.label}
          </span>

          {/* Subtask count */}
          {task.subtasks.length > 0 && (
            <span className="text-xs text-fg-3 flex-shrink-0">
              {completedSubtasks}/{task.subtasks.length}
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Edit */}
            <button
              onClick={() => setModal({ open: true })}
              className="p-1.5 text-fg-3 hover:text-fg-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            {/* Expand toggle */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 text-fg-3 hover:text-fg-2 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Subtasks */}
        {expanded && (
          <div className="border-t border-surface-border pb-2">
            {task.subtasks.map((subtask) => (
              <SubtaskRow
                key={subtask.id}
                subtask={subtask}
                onEdit={() => setModal({ open: true, subtask })}
              />
            ))}
            <button
              onClick={() => setModal({ open: true, addSubtask: true })}
              className="ml-8 mt-1 text-xs text-fg-3 hover:text-fg-2 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add subtask
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal.open && !modal.subtask && !modal.addSubtask && (
        <TaskModal task={task} onClose={() => setModal({ open: false })} />
      )}
      {modal.open && modal.addSubtask && (
        <TaskModal
          parentId={task.id}
          defaultCategory={task.category}
          onClose={() => setModal({ open: false })}
        />
      )}
      {modal.open && modal.subtask && (
        <TaskModal
          task={modal.subtask as SerializedTask}
          onClose={() => setModal({ open: false })}
        />
      )}
    </>
  );
}
