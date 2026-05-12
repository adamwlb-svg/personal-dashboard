"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";

type Props = {
  connectedCount: number;
};

export function PlaidConnect({ connectedCount }: Props) {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [plaidConfigured, setPlaidConfigured] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plaid/link-token", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.configured) {
          setPlaidConfigured(true);
          setLinkToken(d.link_token);
        }
      })
      .catch(() => {});
  }, []);

  const onSuccess = useCallback(
    async (public_token: string) => {
      setConnecting(true);
      try {
        const res = await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_token }),
        });
        const data = await res.json();
        if (data.success) {
          router.refresh();
        }
      } finally {
        setConnecting(false);
      }
    },
    [router]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken ?? "",
    onSuccess,
  });

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/plaid/sync", { method: "POST" });
      const data = await res.json();
      setSyncResult(
        data.balancesUpdated > 0
          ? `Updated ${data.balancesUpdated} balance${data.balancesUpdated !== 1 ? "s" : ""}`
          : "All balances up to date"
      );
      router.refresh();
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncResult(null), 3000);
    }
  }

  if (!plaidConfigured) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
        Add <code className="text-gray-500 bg-surface px-1 rounded">PLAID_CLIENT_ID</code> +{" "}
        <code className="text-gray-500 bg-surface px-1 rounded">PLAID_SECRET</code> to Vercel to enable live sync
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {syncResult && (
        <span className="text-xs text-emerald-400">{syncResult}</span>
      )}
      {connectedCount > 0 && (
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white border border-surface-border hover:border-gray-500 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {syncing ? "Syncing…" : "Sync Balances"}
        </button>
      )}
      <button
        onClick={() => open()}
        disabled={!ready || connecting}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        {connecting ? "Connecting…" : connectedCount > 0 ? "Connect Another" : "Connect Bank"}
      </button>
    </div>
  );
}
