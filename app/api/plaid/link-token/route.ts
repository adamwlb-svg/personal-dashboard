import { NextResponse } from "next/server";
import { Products, CountryCodes } from "plaid";
import { plaidClient, isPlaidConfigured } from "@/lib/plaid";

export async function POST() {
  if (!isPlaidConfigured()) {
    return NextResponse.json({ configured: false });
  }

  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: "personal-dashboard-user" },
    client_name: "Personal Dashboard",
    products: [Products.Transactions],
    country_codes: [CountryCodes.Us],
    language: "en",
  });

  return NextResponse.json({ configured: true, link_token: response.data.link_token });
}
