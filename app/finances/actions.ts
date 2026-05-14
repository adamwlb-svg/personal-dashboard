"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type AccountInput = {
  name: string;
  type: string;
  institution?: string;
  balance: number;
  notes?: string;
};

export async function createAccount(data: AccountInput) {
  const account = await prisma.financialAccount.create({
    data: {
      name: data.name,
      type: data.type,
      institution: data.institution || null,
      balance: data.balance,
      notes: data.notes || null,
    },
  });
  await prisma.balanceSnapshot.create({
    data: { accountId: account.id, balance: data.balance },
  });
  revalidatePath("/finances");
}

export async function updateAccount(id: number, data: AccountInput) {
  const existing = await prisma.financialAccount.findUnique({ where: { id }, select: { balance: true } });
  await prisma.financialAccount.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      institution: data.institution || null,
      balance: data.balance,
      notes: data.notes || null,
    },
  });
  // Record a snapshot only when balance changes
  if (existing && existing.balance !== data.balance) {
    await prisma.balanceSnapshot.create({
      data: { accountId: id, balance: data.balance },
    });
  }
  revalidatePath("/finances");
}

export async function updateBalance(id: number, balance: number) {
  await prisma.financialAccount.update({ where: { id }, data: { balance } });
  await prisma.balanceSnapshot.create({ data: { accountId: id, balance } });
  revalidatePath("/finances");
}

export async function deleteAccount(id: number) {
  await prisma.financialAccount.delete({ where: { id } });
  revalidatePath("/finances");
}

type GoalInput = {
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
};

export async function createGoal(data: GoalInput) {
  await prisma.financialGoal.create({
    data: {
      name: data.name,
      emoji: data.emoji,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
    },
  });
  revalidatePath("/finances");
}

export async function updateGoal(id: number, data: GoalInput) {
  await prisma.financialGoal.update({
    where: { id },
    data: {
      name: data.name,
      emoji: data.emoji,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
    },
  });
  revalidatePath("/finances");
}

export async function deleteGoal(id: number) {
  await prisma.financialGoal.delete({ where: { id } });
  revalidatePath("/finances");
}

// ── Recurring expenses ────────────────────────────────────────────────────────

const FREQ_RRULE: Record<string, string> = {
  weekly:    "FREQ=WEEKLY",
  monthly:   "FREQ=MONTHLY",
  quarterly: "FREQ=MONTHLY;INTERVAL=3",
  yearly:    "FREQ=YEARLY",
};

type RecurringExpenseInput = {
  name: string;
  amount: number;
  frequency: string;
  category: string;
  isAutoPay: boolean;
  nextDueDate: string; // ISO date string
  notes?: string;
};

async function upsertScheduleEvent(expense: {
  id: number;
  name: string;
  frequency: string;
  nextDueDate: Date;
  eventId: number | null;
}): Promise<number> {
  const start = new Date(expense.nextDueDate);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const rrule = FREQ_RRULE[expense.frequency] ?? "FREQ=MONTHLY";
  const data = {
    title: `💳 ${expense.name} due`,
    startTime: start,
    endTime: end,
    allDay: false,
    category: "finance" as const,
    isRecurring: true,
    rrule,
    syncSource: "recurring-expense",
  };

  if (expense.eventId) {
    await prisma.event.update({ where: { id: expense.eventId }, data });
    return expense.eventId;
  } else {
    const ev = await prisma.event.create({ data });
    return ev.id;
  }
}

export async function createRecurringExpense(data: RecurringExpenseInput) {
  const expense = await prisma.recurringExpense.create({
    data: {
      name: data.name,
      amount: data.amount,
      frequency: data.frequency,
      category: data.category,
      isAutoPay: data.isAutoPay,
      nextDueDate: new Date(data.nextDueDate),
      notes: data.notes || null,
    },
  });

  if (!data.isAutoPay) {
    const eventId = await upsertScheduleEvent({
      id: expense.id,
      name: data.name,
      frequency: data.frequency,
      nextDueDate: new Date(data.nextDueDate),
      eventId: null,
    });
    await prisma.recurringExpense.update({ where: { id: expense.id }, data: { eventId } });
    revalidatePath("/schedule");
  }

  revalidatePath("/finances");
}

export async function updateRecurringExpense(id: number, data: RecurringExpenseInput) {
  const existing = await prisma.recurringExpense.findUnique({ where: { id } });

  let eventId = existing?.eventId ?? null;

  if (!data.isAutoPay) {
    // Create or update schedule event
    eventId = await upsertScheduleEvent({
      id,
      name: data.name,
      frequency: data.frequency,
      nextDueDate: new Date(data.nextDueDate),
      eventId,
    });
  } else if (eventId) {
    // Switched to auto-pay — delete the schedule event
    await prisma.event.delete({ where: { id: eventId } }).catch(() => {});
    eventId = null;
  }

  await prisma.recurringExpense.update({
    where: { id },
    data: {
      name: data.name,
      amount: data.amount,
      frequency: data.frequency,
      category: data.category,
      isAutoPay: data.isAutoPay,
      nextDueDate: new Date(data.nextDueDate),
      notes: data.notes || null,
      eventId,
    },
  });

  revalidatePath("/finances");
  revalidatePath("/schedule");
}

export async function deleteRecurringExpense(id: number) {
  const expense = await prisma.recurringExpense.findUnique({ where: { id } });
  if (expense?.eventId) {
    await prisma.event.delete({ where: { id: expense.eventId } }).catch(() => {});
  }
  await prisma.recurringExpense.delete({ where: { id } });
  revalidatePath("/finances");
  revalidatePath("/schedule");
}
