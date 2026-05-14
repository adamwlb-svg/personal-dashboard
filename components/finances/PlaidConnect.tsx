"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";

const LINK_TOKEN_KEY = "plaid_link_token";

type Props = { connectedCount: number };

// Isolated so usePlaidLink fully reinitializes when token changes
function LinkButton({
  token,
  isOAuthReturn,
  connecting,
  onSuccess,
  onExit,
}: {
  token: string;
  isOAuthReturn: boolean;
  connecting: boolean;
  onSuccess: (token: string) => void;
  onExit: () => void;
}) {
  const { open, ready } = usePlaidLink({
    token,
    onSuccess,
    onExit,
    ...(isOAuthReturn ? { receivedRedirectUri: window.location.href } : {}),
  });

  useEffect(() => {
    if (isOAuthReturn && ready) open();
  }, [isOAuthReturn, ready, open]);

  return (
    <button
      onClick={() => open()}
      disabled={!ready || connecting}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-fg text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      {connecting ? "Connecting…" : "Connect Bank"}
    </button>
  );
}

export function PlaidConnect({ connectedCount }: Props) {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [plaidConfigured, setPlaidConfigured] = useState(false);
  const [linkTokenError, setLinkTokenError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [isOAuthReturn, setIsOAuthReturn] = useState(false);

  const redirectUri = typeof window !== "undefined"
    ? `${window.location.origin}/finances`
    : "";

  const fetchLinkToken = useCallback(async (withRedirectUri = false) => {
    setLinkTokenError(null);
    try {
      const res = await fetch("/api/plaid/link-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withRedirectUri ? { redirect_uri: redirectUri } : {}),
      });
      const d = await res.json();
      if (d.configured && d.link_token) {
        setPlaidConfigured(true);
        setLinkToken(d.link_token);
        if (withRedirectUri) sessionStorage.setItem(LINK_TOKEN_KEY, d.link_token);
      } else {
        setPlaidConfigured(d.configured ?? false);
        const errObj = d.error;
        const msg = errObj
          ? (typeof errObj === "object"
              ? (errObj as { error_message?: string; message?: string }).error_message
                ?? (errObj as { error_message?: string; message?: string }).message
                ?? JSON.stringify(errObj)
              : String(errObj))
          : `HTTP ${res.status} — no link token returned`;
        console.error("[Plaid] link token error:", msg, d);
        setLinkTokenError(msg);
      }
    } catch (e) {
      console.error("[Plaid] fetch failed:", e);
      setPlaidConfigured(true);
      setLinkTokenError(String(e));
    }
  }, [redirectUri]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth_state_id")) {
      const stored = sessionStorage.getItem(LINK_TOKEN_KEY);
      if (stored) {
        setIsOAuthReturn(true);
        setPlaidConfigured(true);
        setLinkToken(stored);
        return;
      }
    }
    fetchLinkToken(false);
  }, [fetchLinkToken]);

  const onSuccess = useCallback(
    async (public_token: string) => {
      setConnecting(true);
      sessionStorage.removeItem(LINK_TOKEN_KEY);
      const url = new URL(window.location.href);
      url.searchParams.delete("oauth_state_id");
      window.history.replaceState({}, "", url.toString());
      try {
        const res = await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_token }),
        });
        const data = await res.json();
        if (data.success) router.refresh();
      } finally {
        setConnecting(false);
        setIsOAuthReturn(false);
        // Null out first so key changes, forcing LinkButton to remount with fresh token
        setLinkToken(null);
        fetchLinkToken(false);
      }
    },
    [router, fetchLinkToken]
  );

  const onExit = useCallback(() => {
    if (isOAuthReturn) {
      setIsOAuthReturn(false);
      sessionStorage.removeItem(LINK_TOKEN_KEY);
      setLinkToken(null);
      fetchLinkToken(false);
    }
  }, [isOAuthReturn, fetchLinkToken]);

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
      <div className="flex items-center gap-2 text-xs text-fg-3">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
        Add <code className="text-fg-3 bg-surface px-1 rounded">PLAID_CLIENT_ID</code> +{" "}
        <code className="text-fg-3 bg-surface px-1 rounded">PLAID_SECRET</code> to Vercel to enable live sync
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
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-fg-2 hover:text-fg border border-surface-border hover:border-gray-500 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {syncing ? "Syncing…" : "Sync Balances"}
        </button>
      )}
      {linkToken ? (
        <LinkButton
          key={linkToken}
          token={linkToken}
          isOAuthReturn={isOAuthReturn}
          connecting={connecting}
          onSuccess={onSuccess}
          onExit={onExit}
        />
      ) : linkTokenError ? (
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-400 font-medium">Plaid error</span>
            <button
              onClick={() => fetchLinkToken(false)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-fg text-sm font-medium rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
          <p className="text-xs text-red-300/80 max-w-xs text-right">{linkTokenError}</p>
        </div>
      ) : (
        <button
          disabled
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-fg text-sm font-medium rounded-lg opacity-50"
        >
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Loading…
        </button>
      )}
    </div>
  );
}
