"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Incorrect password");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--surface)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 shadow-2xl border"
        style={{ background: "var(--surface-raised)", borderColor: "var(--surface-border)" }}
      >
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--fg)" }}>
            Personal Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--fg-3)" }}>
            Enter your passphrase to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Passphrase"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
            className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none"
            style={{
              background: "var(--surface)",
              border: `1px solid ${error ? "#f87171" : "var(--surface-border)"}`,
              color: "var(--fg)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = error ? "#f87171" : "var(--surface-border)")}
          />

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-lg py-3 text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: "var(--accent)", color: "var(--fg)" }}
          >
            {loading ? "Unlocking…" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
