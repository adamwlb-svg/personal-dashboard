"use client";

import { useState, useMemo } from "react";
import {
  SerializedTask,
  Filter,
  Sort,
  filterTasks,
  sortTasks,
  groupByCategory,
  TODO_CATEGORIES,
  TodoCategoryKey,
} from "@/lib/todo";
import { TaskItem } from "./TaskItem";
import { TaskModal } from "./TaskModal";
import { createTask } from "@/app/todo/actions";
import { useRouter } from "next/navigation";

type Props = { tasks: SerializedTask[] };

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all",       label: "All" },
  { value: "today",     label: "Today" },
  { value: "overdue",   label: "Overdue" },
  { value: "completed", label: "Completed" },
];

const SORTS: { value: Sort; label: string; icon: string }[] = [
  { value: "priority", label: "Priority", icon: "↑" },
  { value: "due-date", label: "Due Date", icon: "📅" },
  { value: "category", label: "Category", icon: "🏷️" },
];

export function TodoView({ tasks }: Props) {
  const router = useRouter();
  const [filter, setFilter]       = useState<Filter>("all");
  const [sort, setSort]           = useState<Sort>("priority");
  const [quickAdd, setQuickAdd]   = useState("");
  const [adding, setAdding]       = useState(false);
  const [newTaskModal, setNewTaskModal] = useState(false);

  const allTasksFlat = useMemo(
    () => [...tasks, ...tasks.flatMap((t) => t.subtasks)],
    [tasks]
  );
  const totalCount     = allTasksFlat.length;
  const completedCount = allTasksFlat.filter((t) => t.completed).length;
  const progressPct    = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const overdueCount = tasks.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate) < (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })()
  ).length;

  const todayCount = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const d = new Date(t.dueDate);
    return d >= today && d < tomorrow;
  }).length;

  const filtered = useMemo(() => filterTasks(tasks, filter), [tasks, filter]);
  const sorted   = useMemo(() => sortTasks(filtered, sort),  [filtered, sort]);
  const grouped  = useMemo(() => sort === "category" ? groupByCategory(sorted) : null, [sort, sorted]);

  async function handleQuickAdd(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !quickAdd.trim()) return;
    setAdding(true);
    await createTask({ title: quickAdd.trim(), priority: "medium", category: "personal" });
    setQuickAdd("");
    router.refresh();
    setAdding(false);
  }

  const emptyMessage =
    filter === "today"     ? "Nothing due today" :
    filter === "overdue"   ? "You're all caught up" :
    filter === "completed" ? "No completed tasks yet" :
                             "No open tasks — add one above";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-fg">To-Do</h1>
          <p className="text-sm text-fg-2 mt-0.5">
            {completedCount} of {totalCount} tasks complete
          </p>
        </div>
        <button
          onClick={() => setNewTaskModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-fg text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </button>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="mb-6">
          <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-fg-3 mt-1 text-right">{progressPct}% complete</p>
        </div>
      )}

      {/* Quick add */}
      <div className="flex items-center gap-3 mb-5 bg-surface-raised border border-surface-border rounded-xl px-4 py-3">
        <svg className="w-4 h-4 text-fg-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <input
          type="text"
          placeholder="Quick add a task… (press Enter)"
          value={quickAdd}
          onChange={(e) => setQuickAdd(e.target.value)}
          onKeyDown={handleQuickAdd}
          disabled={adding}
          className="flex-1 bg-transparent text-sm text-fg placeholder-gray-500 focus:outline-none"
        />
      </div>

      {/* Filter + Sort row */}
      <div className="flex items-center gap-3 mb-5">
        {/* Filter tabs */}
        <div className="flex flex-1 gap-1 bg-surface-raised border border-surface-border rounded-xl p-1">
          {FILTERS.map((f) => {
            const badge = f.value === "overdue" ? overdueCount : f.value === "today" ? todayCount : null;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5
                  ${filter === f.value ? "bg-accent/20 text-accent" : "text-fg-2 hover:text-fg"}`}
              >
                {f.label}
                {badge != null && badge > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                    ${f.value === "overdue" ? "bg-red-500/20 text-red-400" : "bg-accent/20 text-accent"}`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sort selector */}
        <div className="flex gap-1 bg-surface-raised border border-surface-border rounded-xl p-1 flex-shrink-0">
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSort(s.value)}
              title={`Sort by ${s.label}`}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1
                ${sort === s.value ? "bg-accent/20 text-accent" : "text-fg-3 hover:text-fg-2"}`}
            >
              <span>{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-fg-3 text-sm">{emptyMessage}</div>
      ) : grouped ? (
        // Category-grouped view
        <div className="space-y-6">
          {grouped.map(({ category, tasks: catTasks }) => {
            const meta = TODO_CATEGORIES[category as TodoCategoryKey];
            return (
              <div key={category}>
                <div className={`flex items-center gap-2 mb-2 px-1`}>
                  <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${meta?.bg ?? "bg-surface-raised"} ${meta?.text ?? "text-fg-2"} ${meta?.border ?? "border-surface-border"}`}>
                    {meta?.label ?? category}
                  </span>
                  <span className="text-xs text-fg-3">{catTasks.length} task{catTasks.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-2">
                  {catTasks.map((task) => <TaskItem key={task.id} task={task} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Flat list (priority or due-date sort)
        <div className="space-y-2">
          {sorted.map((task) => <TaskItem key={task.id} task={task} />)}
        </div>
      )}

      {newTaskModal && (
        <TaskModal onClose={() => setNewTaskModal(false)} />
      )}
    </div>
  );
}
