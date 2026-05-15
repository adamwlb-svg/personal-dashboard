"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type QuickLinkInput = {
  title: string;
  url: string;
  category: string;
  emoji?: string;
  sortOrder?: number;
};

export async function createQuickLink(data: QuickLinkInput) {
  await prisma.quickLink.create({ data });
  revalidatePath("/links");
}

export async function updateQuickLink(id: number, data: Partial<QuickLinkInput>) {
  await prisma.quickLink.update({ where: { id }, data });
  revalidatePath("/links");
}

export async function deleteQuickLink(id: number) {
  await prisma.quickLink.delete({ where: { id } });
  revalidatePath("/links");
}
