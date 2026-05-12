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
