"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type TaskInput = {
  title: string;
  notes?: string;
  dueDate?: string;
  priority: string;
  category: string;
  parentId?: number;
  addToCalendar?: boolean;
};

export async function createTask(data: TaskInput) {
  let eventId: number | undefined;

  if (data.addToCalendar && data.dueDate) {
    const due = new Date(data.dueDate);
    const start = new Date(due);
    start.setHours(9, 0, 0, 0);
    const end = new Date(due);
    end.setHours(10, 0, 0, 0);

    const event = await prisma.event.create({
      data: {
        title: data.title,
        startTime: start,
        endTime: end,
        allDay: false,
        category: ["work", "health", "social", "personal"].includes(data.category)
          ? data.category
          : "personal",
        syncSource: "task",
      },
    });
    eventId = event.id;
  }

  await prisma.task.create({
    data: {
      title: data.title,
      notes: data.notes || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: data.priority,
      category: data.category,
      parentId: data.parentId ?? null,
      eventId: eventId ?? null,
    },
  });

  revalidatePath("/todo");
  if (eventId) revalidatePath("/schedule");
}

export async function updateTask(id: number, data: TaskInput) {
  const existing = await prisma.task.findUnique({
    where: { id },
    select: { eventId: true },
  });

  let eventId = existing?.eventId ?? null;

  if (data.addToCalendar && data.dueDate && !eventId) {
    const due = new Date(data.dueDate);
    const start = new Date(due);
    start.setHours(9, 0, 0, 0);
    const end = new Date(due);
    end.setHours(10, 0, 0, 0);

    const event = await prisma.event.create({
      data: {
        title: data.title,
        startTime: start,
        endTime: end,
        allDay: false,
        category: ["work", "health", "social", "personal"].includes(data.category)
          ? data.category
          : "personal",
        syncSource: "task",
      },
    });
    eventId = event.id;
  }

  if (!data.addToCalendar && eventId) {
    await prisma.event.delete({ where: { id: eventId } }).catch(() => {});
    eventId = null;
  }

  await prisma.task.update({
    where: { id },
    data: {
      title: data.title,
      notes: data.notes || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: data.priority,
      category: data.category,
      eventId,
    },
  });

  revalidatePath("/todo");
  revalidatePath("/schedule");
}

export async function toggleComplete(id: number, completed: boolean) {
  await prisma.task.update({
    where: { id },
    data: { completed, completedAt: completed ? new Date() : null },
  });
  revalidatePath("/todo");
}

export async function deleteTask(id: number) {
  const task = await prisma.task.findUnique({
    where: { id },
    select: { eventId: true },
  });
  if (task?.eventId) {
    await prisma.event.delete({ where: { id: task.eventId } }).catch(() => {});
  }
  await prisma.task.delete({ where: { id } });
  revalidatePath("/todo");
  revalidatePath("/schedule");
}
