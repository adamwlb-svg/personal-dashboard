"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SerializedFinanceTodo } from "@/lib/finance";
import { toggleComplete, createTask } from "@/app/todo/actions";

type Props = {
  todos: SerializedFinanceTodo[];
};

export function HealthTodos({ todos }: Props) {
  const router = useRouter();
  const [newTask, setNewTask] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !newTask.trim()) return;
    setAdding(true);
    await createTask({ title: newTask.trim(), category: "health", priority: "medium" });
    setNewTask("");
    setAdding(false);
    router.refresh();
  }

  async function handleToggle(id: number, completed: boolean) {
    await toggleComplete(id, !completed);
    router.refresh();
  }

  const open = todos.filter((t) => !t.completed);
  const done = todos.filter((t) => t.completed);

  return (
    <div className="bg-surface-raised border border-surface-border rounded-xl flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
        <h3 className="text-sm font-semibold text-white">Health To-Dos</h3>
        {open.length > 0 && (
          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            {open.length} open
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        <input
          type="text"
          placeholder="Add a health task…"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={handleAdd}
          disabled={adding}
          className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent disabled:opacity-50"
        />

        {todos.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-4">
            No health tasks yet. Add one above or create it in the To-Do tab.
          </p>
        )}

        {open.map((task) => (
          <TodoRow key={task.id} task={task} onToggle={handleToggle} />
        ))}

        {done.length > 0 && (
          <>
            <p className="text-xs text-gray-600 pt-1">Completed</p>
            {done.map((task) => (
              <TodoRow key={task.id} task={task} onToggle={handleToggle} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function TodoRow({
  task,
  onToggle,
}: {
  task: SerializedFinanceTodo;
  onToggle: (id: number, completed: boolean) => void;
}) {
  const priorityColor =
    task.priority === "high" ? "bg-red-500" : task.priority === "medium" ? "bg-yellow-500" : "bg-gray-500";
  const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div className="flex items-start gap-2 group">
      <button
        onClick={() => onToggle(task.id, task.completed)}
        className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border transition-colors
          ${task.completed ? "bg-accent border-accent" : "border-surface-border hover:border-accent"}`}
      >
        {task.completed && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${task.completed ? "line-through text-gray-500" : "text-gray-200"}`}>
          {task.title}
        </p>
        {task.dueDate && (
          <p className={`text-xs mt-0.5 ${isOverdue ? "text-red-400" : "text-gray-500"}`}>
            {isOverdue ? "Overdue · " : "Due "}
            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        )}
      </div>

      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${priorityColor}`} />
    </div>
  );
}
