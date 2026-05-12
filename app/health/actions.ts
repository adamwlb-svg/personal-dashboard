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
