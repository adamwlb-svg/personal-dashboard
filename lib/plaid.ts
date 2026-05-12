import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const env = (process.env.PLAID_ENV ?? "sandbox") as keyof typeof PlaidEnvironments;

export const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID ?? "",
        "PLAID-SECRET": process.env.PLAID_SECRET ?? "",
      },
    },
  })
);

export function isPlaidConfigured() {
  return !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}

// Map Plaid account type/subtype → our internal type
export function mapPlaidType(type: string, subtype: string | null | undefined): string {
  switch (type) {
    case "depository":
      return subtype === "savings" || subtype === "money market" || subtype === "cd"
        ? "savings"
        : "checking";
    case "credit":
      return "credit_card";
    case "loan":
    case "mortgage":
      return "loan";
    case "investment":
    case "brokerage":
      return "investment";
    default:
      return "other";
  }
}
