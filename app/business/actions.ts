"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type BusinessIdeaInput = {
  title: string;
  description?: string;
  stage: string;
  tags?: string;
  notes?: string;
};

export async function createBusinessIdea(data: BusinessIdeaInput) {
  await prisma.businessIdea.create({ data });
  revalidatePath("/business");
}

export async function updateBusinessIdea(id: number, data: BusinessIdeaInput) {
  await prisma.businessIdea.update({ where: { id }, data });
  revalidatePath("/business");
}

export async function deleteBusinessIdea(id: number) {
  await prisma.businessIdea.delete({ where: { id } });
  revalidatePath("/business");
}
