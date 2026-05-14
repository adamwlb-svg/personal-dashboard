import { NextRequest, NextResponse } from "next/server";
import { Products, CountryCode } from "plaid";
import { plaidClient, isPlaidConfigured } from "@/lib/plaid";

export async function POST(req: NextRequest) {
  if (!isPlaidConfigured()) {
    return NextResponse.json({ configured: false });
  }

  // Read from request body (for OAuth return flow) or fall back to env var
  const body = await req.json().catch(() => ({}));
  const redirectUri: string | undefined =
    body.redirect_uri ?? process.env.PLAID_REDIRECT_URI ?? undefined;

  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: "personal-dashboard-user" },
      client_name: "Personal Dashboard",
      products: [Products.Auth],
      optional_products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
      ...(redirectUri ? { redirect_uri: redirectUri } : {}),
    });

    return NextResponse.json({ configured: true, link_token: response.data.link_token });
  } catch (err: unknown) {
    const body = (err as { response?: { data?: unknown } })?.response?.data;
    return NextResponse.json(
      { configured: true, error: body ?? String(err) },
      { status: 500 }
    );
  }
}
