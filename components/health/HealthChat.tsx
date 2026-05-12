"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SerializedChatMessage } from "@/lib/health";

type Props = {
  initialMessages: SerializedChatMessage[];
  aiConfigured: boolean;
};

export function HealthChat({ initialMessages, aiConfigured }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading || !aiConfigured) return;
    const text = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: text, createdAt: new Date().toISOString() },
    ]);
    setLoading(true);

    try {
      const res = await fetch("/api/health/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (data.configured && data.message) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: "assistant", content: data.message, createdAt: new Date().toISOString() },
        ]);
        if (data.logged) router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface-raised border border-surface-border rounded-xl flex flex-col" style={{ height: 420 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border flex-shrink-0">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          🤖 Health Assistant
        </h3>
        {aiConfigured ? (
          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Active
          </span>
        ) : (
          <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            API key needed
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            {aiConfigured ? (
              <>
                <p className="text-sm text-gray-300 font-medium">Ready to help</p>
                <p className="text-xs text-gray-500 mt-1">
                  Log meals, workouts, ask health questions, or request insights from your data.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-300 font-medium">AI Health Assistant</p>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  To activate, add{" "}
                  <code className="bg-surface text-accent px-1 py-0.5 rounded text-xs">ANTHROPIC_API_KEY</code>{" "}
                  to your Vercel environment variables. Once set, you can log food, track workouts, and get personalized insights.
                </p>
                <a
                  href="https://console.anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-xs text-accent hover:underline"
                >
                  Get an API key →
                </a>
              </>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap
                ${msg.role === "user"
                  ? "bg-accent/20 text-white border border-accent/30"
                  : "bg-surface border border-surface-border text-gray-200"}`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-surface-border rounded-xl px-3 py-2.5 flex gap-1">
              {[0, 150, 300].map((delay) => (
                <div
                  key={delay}
                  className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-surface-border flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={
              aiConfigured
                ? "e.g. "I slept 7.5 hrs", "ran 30 min", "took Vitamin D 2000mg"…"
                : "Add ANTHROPIC_API_KEY to Vercel to activate"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={!aiConfigured || loading}
            className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!aiConfigured || loading || !input.trim()}
            className="px-3 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
