"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type EventInput = {
  title: string;
  emoji?: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  category: string;
  isRecurring: boolean;
  rrule?: string;
  recurrenceEnd?: string;
};

export async function createEvent(data: EventInput) {
  await prisma.event.create({
    data: {
      title: data.title,
      emoji: data.emoji || null,
      description: data.description || null,
      location: data.location || null,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      allDay: data.allDay,
      category: data.category,
      isRecurring: data.isRecurring,
      rrule: data.rrule || null,
      recurrenceEnd: data.recurrenceEnd ? new Date(data.recurrenceEnd) : null,
    },
  });
  revalidatePath("/schedule");
}

export async function updateEvent(id: number, data: EventInput) {
  await prisma.event.update({
    where: { id },
    data: {
      title: data.title,
      emoji: data.emoji || null,
      description: data.description || null,
      location: data.location || null,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      allDay: data.allDay,
      category: data.category,
      isRecurring: data.isRecurring,
      rrule: data.rrule || null,
      recurrenceEnd: data.recurrenceEnd ? new Date(data.recurrenceEnd) : null,
    },
  });
  revalidatePath("/schedule");
}

export async function deleteEvent(id: number) {
  await prisma.event.delete({ where: { id } });
  revalidatePath("/schedule");
}

export async function moveEvent(id: number, startTime: string, endTime: string) {
  await prisma.event.update({
    where: { id },
    data: { startTime: new Date(startTime), endTime: new Date(endTime) },
  });
  revalidatePath("/schedule");
}
