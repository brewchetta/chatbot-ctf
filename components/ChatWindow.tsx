"use client";

import { useEffect, useRef, useState } from "react";
import DefenseBadge from "./DefenseBadge";
import FlagBanner, { type Captures } from "./FlagBanner";

interface Msg {
  role: "user" | "assistant";
  content: string;
  trace?: string[];
  blocked?: boolean;
  error?: boolean;
}

const NO_CAPTURES: Captures = { flag: false, bonusPrompt: false, bonusFile: false };
const GREETING: Msg = {
  role: "assistant",
  content: "Corporal Chatsworth reporting for duty, sir! Ask me about the cafeteria, press releases, careers, or the (distant) bathroom.",
};

export default function ChatWindow({ level }: { level: { id: string; name: string; blurb: string } }) {
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [captures, setCaptures] = useState<Captures>(NO_CAPTURES);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);

    try {
      // Skip the greeting and any local error bubbles; the server is stateless.
      const history = next
        .filter((m) => !m.error && m !== GREETING)
        .map(({ role, content }) => ({ role, content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsgs([...next, { role: "assistant", content: data.error ?? "Something went wrong.", error: true }]);
      } else {
        setMsgs([...next, { role: "assistant", content: data.reply, trace: data.trace, blocked: data.blocked }]);
        setCaptures((c) => ({
          flag: c.flag || data.captures.flag,
          bonusPrompt: c.bonusPrompt || data.captures.bonusPrompt,
          bonusFile: c.bonusFile || data.captures.bonusFile,
        }));
      }
    } catch {
      setMsgs([...next, { role: "assistant", content: "Could not reach the server.", error: true }]);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setMsgs([GREETING]);
    setCaptures(NO_CAPTURES);
  }

  return (
    <div>
      <DefenseBadge name={level.name} blurb={level.blurb} />
      <FlagBanner captures={captures} />

      <div className="h-[28rem] overflow-y-auto rounded-lg border border-navy/15 bg-paper p-4 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words " +
                (m.role === "user"
                  ? "bg-navy text-white"
                  : m.error
                    ? "bg-red-100 text-red-900 border border-red-300"
                    : m.blocked
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-white border border-navy/10")
              }
            >
              {m.role === "assistant" && !m.error && (
                <div className="text-[10px] font-bold tracking-widest text-navy/50 mb-1">CPL. CHATSWORTH</div>
              )}
              {m.content}
              {m.trace && m.trace.length > 0 && (
                <div className="mt-2 border-t border-navy/10 pt-1 font-mono text-[11px] text-navy/60">
                  {m.trace.map((t, j) => (
                    <div key={j}>🔧 {t}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && <div className="text-sm text-navy/50 italic">Corporal Chatsworth is rummaging through the files…</div>}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={2000}
          placeholder="Type a message…"
          className="flex-1 rounded border border-navy/30 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <button
          disabled={busy || !input.trim()}
          className="rounded bg-navy px-5 py-2 text-sm font-bold text-gold disabled:opacity-40"
        >
          Send
        </button>
        <button type="button" onClick={reset} className="rounded border border-navy/30 px-3 py-2 text-sm hover:bg-navy/5">
          Reset
        </button>
      </form>
    </div>
  );
}
