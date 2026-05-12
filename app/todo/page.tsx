import { prisma } from "@/lib/prisma";
import { TodoView } from "@/components/todo/TodoView";

export const dynamic = "force-dynamic";

export default async function TodoPage() {
  let tasks: Awaited<ReturnType<typeof prisma.task.findMany>> = [];

  try {
    tasks = await prisma.task.findMany({
      where: { parentId: null },
      include: { subtasks: { orderBy: { createdAt: "asc" } } },
      orderBy: [{ completed: "asc" }, { createdAt: "asc" }],
    });
  } catch {
    // Database not yet migrated — render empty list
  }

  const serialized = tasks.map((t) => ({
    ...t,
    dueDate: t.dueDate?.toISOString() ?? null,
    completedAt: t.completedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    subtasks: t.subtasks.map((s) => ({
      ...s,
      dueDate: s.dueDate?.toISOString() ?? null,
      completedAt: s.completedAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
  }));

  return (
    <div className="p-8 overflow-y-auto flex-1">
      <TodoView tasks={serialized} />
    </div>
  );
}
