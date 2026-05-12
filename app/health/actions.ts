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
