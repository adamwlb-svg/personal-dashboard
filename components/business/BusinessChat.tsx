"use client";

import { useState, useRef, useEffect } from "react";

type Message = { id: number; role: string; content: string; createdAt: string };

const STARTERS = [
  "What white space opportunities exist in the health-tech space?",
  "Help me pressure-test my latest idea",
  "What markets are ripe for disruption right now?",
  "What's a good framework for validating an idea quickly?",
];

export function BusinessChat({
  initialMessages,
  aiConfigured,
}: {
  initialMessages: Message[];
  aiConfigured: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading || !aiConfigured) return;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: msg, createdAt: new Date().toISOString() },
    ]);
    setLoading(true);
    try {
      const res = await fetch("/api/business/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: messages.slice(-16).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (data.configured && data.message) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: "assistant", content: data.message, createdAt: new Date().toISOString() },
        ]);
      }
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="bg-surface-raised border border-surface-border rounded-xl flex flex-col" style={{ height: 560 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border flex-shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
            🚀 Startup Advisor
          </h3>
          <p className="text-xs text-fg-3 mt-0.5">White space analyst · Idea pressure-tester · GTM strategist</p>
        </div>
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
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            {aiConfigured ? (
              <>
                <p className="text-3xl mb-3">💡</p>
                <p className="text-sm font-semibold text-fg mb-1">Ready to brainstorm</p>
                <p className="text-xs text-fg-3 leading-relaxed mb-6 max-w-sm">
                  Describe an idea to pressure-test it, ask about market opportunities, or explore a specific industry for white space.
                </p>
                <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="text-left text-xs px-3 py-2.5 rounded-lg bg-surface border border-surface-border text-fg-2 hover:text-fg hover:border-gray-500 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-3xl mb-3">🔑</p>
                <p className="text-sm font-semibold text-fg-2 mb-2">AI Advisor not activated</p>
                <p className="text-xs text-fg-3 leading-relaxed">
                  Add{" "}
                  <code className="bg-surface text-accent px-1 py-0.5 rounded">ANTHROPIC_API_KEY</code>{" "}
                  to your Vercel environment variables to activate the advisor.
                </p>
                <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer"
                  className="mt-3 text-xs text-accent hover:underline">
                  Get an API key →
                </a>
              </>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-xs flex-shrink-0 mt-0.5 mr-2">
                🚀
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                ${msg.role === "user"
                  ? "bg-accent/20 text-fg border border-accent/30 rounded-br-sm"
                  : "bg-surface border border-surface-border text-fg rounded-bl-sm"}`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-xs flex-shrink-0">
              🚀
            </div>
            <div className="bg-surface border border-surface-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
              {[0, 150, 300].map((delay) => (
                <div key={delay} className="w-1.5 h-1.5 bg-fg-3 rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}ms` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-surface-border flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            rows={1}
            placeholder={aiConfigured ? "Describe an idea, ask about a market, or request a framework…" : "Add ANTHROPIC_API_KEY to activate"}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            disabled={!aiConfigured || loading}
            className="flex-1 bg-surface border border-surface-border rounded-xl px-4 py-2.5 text-sm text-fg placeholder-fg-4 focus:outline-none focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed resize-none leading-relaxed"
            style={{ minHeight: "40px" }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!aiConfigured || loading || !input.trim()}
            className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-fg rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            Send
          </button>
        </div>
        <p className="text-[10px] text-fg-3 mt-2">Shift+Enter for new line · Enter to send</p>
      </div>
    </div>
  );
}
