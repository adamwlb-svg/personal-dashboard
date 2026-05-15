"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCountdown(data: { title: string; emoji: string; date: string }) {
  await prisma.countdown.create({ data: { ...data, date: new Date(data.date) } });
  revalidatePath("/");
}

export async function updateCountdown(id: number, data: { title: string; emoji: string; date: string }) {
  await prisma.countdown.update({ where: { id }, data: { ...data, date: new Date(data.date) } });
  revalidatePath("/");
}

export async function deleteCountdown(id: number) {
  await prisma.countdown.delete({ where: { id } });
  revalidatePath("/");
}
