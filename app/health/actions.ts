"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function logMetric(data: {
  type: string;
  value: number;
  unit: string;
  notes?: string;
  loggedAt?: string;
}) {
  await prisma.healthMetric.create({
    data: {
      type: data.type,
      value: data.value,
      unit: data.unit,
      notes: data.notes || null,
      loggedAt: data.loggedAt ? new Date(data.loggedAt) : new Date(),
    },
  });
  revalidatePath("/health");
}

export async function deleteMetric(id: number) {
  await prisma.healthMetric.delete({ where: { id } });
  revalidatePath("/health");
}

export async function logSupplement(data: {
  name: string;
  amount: number;
  unit: string;
  notes?: string;
  loggedAt?: string;
}) {
  await prisma.supplementEntry.create({
    data: {
      name: data.name,
      amount: data.amount,
      unit: data.unit,
      notes: data.notes || null,
      loggedAt: data.loggedAt ? new Date(data.loggedAt) : new Date(),
    },
  });
  revalidatePath("/health");
}

export async function deleteSupplement(id: number) {
  await prisma.supplementEntry.delete({ where: { id } });
  revalidatePath("/health");
}

// ── Daily supplement stack ────────────────────────────────────────────────────

export async function createDailySupplement(data: { name: string; amount: number; unit: string }) {
  const count = await prisma.dailySupplement.count();
  await prisma.dailySupplement.create({
    data: { name: data.name, amount: data.amount, unit: data.unit, sortOrder: count },
  });
  revalidatePath("/health");
}

export async function updateDailySupplement(id: number, data: { name: string; amount: number; unit: string; isActive: boolean }) {
  await prisma.dailySupplement.update({ where: { id }, data });
  revalidatePath("/health");
}

export async function deleteDailySupplement(id: number) {
  await prisma.dailySupplement.delete({ where: { id } });
  revalidatePath("/health");
}

export async function logDailyStack(
  supplements: Array<{ name: string; amount: number; unit: string }>
) {
  for (const s of supplements) {
    await prisma.supplementEntry.create({
      data: { name: s.name, amount: s.amount, unit: s.unit },
    });
  }
  revalidatePath("/health");
}

// Called server-side on page load — auto-logs the active daily stack once per day.
// Tracks completion in DailyStackAutoLog so deleted entries aren't re-created on refresh.
export async function ensureDailyStackLogged(): Promise<void> {
  const today = new Date().toISOString().substring(0, 10);
  try {
    const alreadyDone = await prisma.dailyStackAutoLog.findUnique({ where: { date: today } });
    if (alreadyDone) return;

    const activeStack = await prisma.dailySupplement.findMany({ where: { isActive: true } });
    if (activeStack.length > 0) {
      await prisma.supplementEntry.createMany({
        data: activeStack.map((s) => ({ name: s.name, amount: s.amount, unit: s.unit })),
      });
    }

    await prisma.dailyStackAutoLog.create({ data: { date: today } });
  } catch {
    // Table may not exist yet on first deploy — silently skip
  }
}

// ── Workout entries ───────────────────────────────────────────────────────────

export async function logWorkout(data: {
  activity: string;
  minutes: number;
  notes?: string;
  loggedAt?: string;
}) {
  await prisma.workoutEntry.create({
    data: {
      activity: data.activity,
      minutes: data.minutes,
      notes: data.notes || null,
      loggedAt: data.loggedAt ? new Date(data.loggedAt) : new Date(),
    },
  });
  revalidatePath("/health");
}

export async function deleteWorkout(id: number) {
  await prisma.workoutEntry.delete({ where: { id } });
  revalidatePath("/health");
}
