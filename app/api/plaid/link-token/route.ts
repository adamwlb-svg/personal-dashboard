import { NextResponse } from "next/server";
import { Products, CountryCode } from "plaid";
import { plaidClient, isPlaidConfigured } from "@/lib/plaid";

export async function POST() {
  if (!isPlaidConfigured()) {
    return NextResponse.json({ configured: false });
  }

  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: "personal-dashboard-user" },
      client_name: "Personal Dashboard",
      products: [Products.Auth],
      optional_products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
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
