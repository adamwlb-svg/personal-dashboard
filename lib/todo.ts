export const TODO_CATEGORIES = {
  work:     { label: "Work",     bg: "bg-blue-500/20",    text: "text-blue-300",    border: "border-blue-500/30" },
  home:     { label: "Home",     bg: "bg-orange-500/20",  text: "text-orange-300",  border: "border-orange-500/30" },
  finance:  { label: "Finance",  bg: "bg-green-500/20",   text: "text-green-300",   border: "border-green-500/30" },
  health:   { label: "Health",   bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30" },
  social:   { label: "Social",   bg: "bg-amber-500/20",   text: "text-amber-300",   border: "border-amber-500/30" },
  personal: { label: "Personal", bg: "bg-violet-500/20",  text: "text-violet-300",  border: "border-violet-500/30" },
  travel:   { label: "Travel",   bg: "bg-cyan-500/20",    text: "text-cyan-300",    border: "border-cyan-500/30" },
} as const;

export type TodoCategoryKey = keyof typeof TODO_CATEGORIES;

export const PRIORITIES = {
  high:   { label: "High",   dot: "bg-red-500",   text: "text-red-400" },
  medium: { label: "Medium", dot: "bg-amber-400",  text: "text-amber-400" },
  low:    { label: "Low",    dot: "bg-blue-400",   text: "text-blue-400" },
} as const;

export type PriorityKey = keyof typeof PRIORITIES;

export const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export type Subtask = {
  id: number;
  title: string;
  notes: string | null;
  completed: boolean;
  completedAt: string | null;
  dueDate: string | null;
  priority: string;
  category: string;
  parentId: number | null;
  eventId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type SerializedTask = Subtask & {
  subtasks: Subtask[];
};

export type Filter = "all" | "today" | "overdue" | "completed";
export type Sort = "priority" | "due-date" | "category";

export function filterTasks(tasks: SerializedTask[], filter: Filter): SerializedTask[] {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  switch (filter) {
    case "today":
      return tasks.filter((t) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return d >= todayStart && d < todayEnd;
      });
    case "overdue":
      return tasks.filter(
        (t) => !t.completed && t.dueDate && new Date(t.dueDate) < todayStart
      );
    case "completed":
      return tasks.filter((t) => t.completed);
    default:
      return tasks.filter((t) => !t.completed);
  }
}

export function sortTasks(tasks: SerializedTask[], sort: Sort = "priority"): SerializedTask[] {
  return [...tasks].sort((a, b) => {
    // Completed tasks always sink to the bottom
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    if (sort === "due-date") {
      // Due date first (nulls last), then priority
      if (a.dueDate && b.dueDate)
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      const pa = PRIORITY_ORDER[a.priority] ?? 1;
      const pb = PRIORITY_ORDER[b.priority] ?? 1;
      return pa - pb;
    }

    if (sort === "category") {
      // Category name alphabetically, then priority within category
      const ca = a.category.localeCompare(b.category);
      if (ca !== 0) return ca;
      const pa = PRIORITY_ORDER[a.priority] ?? 1;
      const pb = PRIORITY_ORDER[b.priority] ?? 1;
      if (pa !== pb) return pa - pb;
      if (a.dueDate && b.dueDate)
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    }

    // Default: priority → due date
    const pa = PRIORITY_ORDER[a.priority] ?? 1;
    const pb = PRIORITY_ORDER[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    if (a.dueDate && b.dueDate)
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });
}

// Returns tasks grouped by category, preserving sort within each group
export function groupByCategory(tasks: SerializedTask[]): { category: string; tasks: SerializedTask[] }[] {
  const map = new Map<string, SerializedTask[]>();
  for (const t of tasks) {
    if (!map.has(t.category)) map.set(t.category, []);
    map.get(t.category)!.push(t);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, tasks]) => ({ category, tasks }));
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) < today;
}

export function formatDueDate(dueDate: string): string {
  const d = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d >= today && d < tomorrow) return "Today";
  if (d >= tomorrow && d < new Date(tomorrow.getTime() + 86400000)) return "Tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
