"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createBudgetCategory(data: { name: string; emoji: string; amount: number; color: string }) {
  await prisma.budgetCategory.create({ data });
  revalidatePath("/finances");
}

export async function updateBudgetCategory(id: number, data: { name: string; emoji: string; amount: number; color: string }) {
  await prisma.budgetCategory.update({ where: { id }, data });
  revalidatePath("/finances");
}

export async function deleteBudgetCategory(id: number) {
  await prisma.budgetCategory.delete({ where: { id } });
  revalidatePath("/finances");
}

export async function createBudgetEntry(data: { categoryId: number; amount: number; description?: string; date: string }) {
  await prisma.budgetEntry.create({
    data: { ...data, date: new Date(data.date) },
  });
  revalidatePath("/finances");
}

export async function deleteBudgetEntry(id: number) {
  await prisma.budgetEntry.delete({ where: { id } });
  revalidatePath("/finances");
}
