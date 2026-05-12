import { NextRequest, NextResponse } from "next/server";
import { CountryCodes } from "plaid";
import { plaidClient, isPlaidConfigured, mapPlaidType } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: "Plaid not configured" }, { status: 400 });
  }

  const { public_token } = await req.json();

  // Exchange public token for permanent access token
  const tokenRes = await plaidClient.itemPublicTokenExchange({ public_token });
  const { access_token, item_id } = tokenRes.data;

  // Resolve institution name
  const itemRes = await plaidClient.itemGet({ access_token });
  const institutionId = itemRes.data.item.institution_id;
  let institutionName: string | null = null;
  if (institutionId) {
    const instRes = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: [CountryCodes.Us],
    });
    institutionName = instRes.data.institution.name;
  }

  // Persist the PlaidItem (upsert so re-connecting the same bank is safe)
  const plaidItem = await prisma.plaidItem.upsert({
    where: { itemId: item_id },
    create: { itemId: item_id, accessToken: access_token, institution: institutionName },
    update: { accessToken: access_token, institution: institutionName },
  });

  // Fetch live balances for all accounts at this institution
  const balRes = await plaidClient.accountsBalanceGet({ access_token });

  for (const acct of balRes.data.accounts) {
    const type = mapPlaidType(acct.type, acct.subtype);
    // Use current balance; fall back to available if current is null
    const balance = acct.balances.current ?? acct.balances.available ?? 0;

    const existing = await prisma.financialAccount.findUnique({
      where: { plaidAccountId: acct.account_id },
    });

    if (existing) {
      if (existing.balance !== balance) {
        await prisma.financialAccount.update({
          where: { id: existing.id },
          data: { balance, institution: institutionName },
        });
        await prisma.balanceSnapshot.create({
          data: { accountId: existing.id, balance },
        });
      }
    } else {
      const newAcct = await prisma.financialAccount.create({
        data: {
          name: acct.name,
          type,
          institution: institutionName,
          balance,
          currency: acct.balances.iso_currency_code ?? "USD",
          plaidAccountId: acct.account_id,
          plaidItemId: plaidItem.id,
        },
      });
      await prisma.balanceSnapshot.create({
        data: { accountId: newAcct.id, balance },
      });
    }
  }

  return NextResponse.json({ success: true, accounts: balRes.data.accounts.length });
}
