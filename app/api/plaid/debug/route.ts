import { NextResponse } from "next/server";
import { Products, CountryCode } from "plaid";
import { plaidClient } from "@/lib/plaid";

export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret   = process.env.PLAID_SECRET;
  const env      = process.env.PLAID_ENV ?? "(not set)";

  const result: Record<string, unknown> = {
    env,
    clientIdPresent: !!clientId,
    clientIdPreview: clientId ? clientId.slice(0, 6) + "…" : null,
    secretPresent: !!secret,
    secretPreview: secret ? secret.slice(0, 6) + "…" : null,
  };

  // Try creating a link token to surface any Plaid API errors
  try {
    const res = await plaidClient.linkTokenCreate({
      user: { client_user_id: "debug-user" },
      client_name: "Personal Dashboard",
      products: [Products.Auth],
      optional_products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    });
    result.linkTokenOk = true;
    result.linkTokenPreview = res.data.link_token.slice(0, 20) + "…";
  } catch (err: unknown) {
    result.linkTokenOk = false;
    result.plaidError = (err as { response?: { data?: unknown } })?.response?.data ?? String(err);
  }

  return NextResponse.json(result);
}
