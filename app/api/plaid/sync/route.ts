import { NextResponse } from "next/server";
import { plaidClient, isPlaidConfigured } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";

export async function POST() {
  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: "Plaid not configured" }, { status: 400 });
  }

  const items = await prisma.plaidItem.findMany();
  let updated = 0;

  for (const item of items) {
    const balRes = await plaidClient.accountsBalanceGet({ access_token: item.accessToken });

    for (const acct of balRes.data.accounts) {
      const existing = await prisma.financialAccount.findUnique({
        where: { plaidAccountId: acct.account_id },
      });
      if (!existing) continue;

      const balance = acct.balances.current ?? acct.balances.available ?? existing.balance;
      if (balance !== existing.balance) {
        await prisma.financialAccount.update({ where: { id: existing.id }, data: { balance } });
        await prisma.balanceSnapshot.create({ data: { accountId: existing.id, balance } });
        updated++;
      }
    }
  }

  return NextResponse.json({ success: true, itemsSynced: items.length, balancesUpdated: updated });
}
