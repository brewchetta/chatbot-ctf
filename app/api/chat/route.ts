import { NextResponse } from "next/server";
import { runAgent, type ChatMessage } from "@/lib/agent";
import { detectCaptures } from "@/lib/capture";
import { getDefense } from "@/lib/defenses";

export const runtime = "nodejs";

const MAX_MESSAGES = 20;
const MAX_CHARS = 2000;
const RATE_LIMIT = 30; // requests per minute per client — protects the group's API key
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > RATE_LIMIT;
}

function parseHistory(body: unknown): ChatMessage[] | null {
  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return null;
  const out: ChatMessage[] = [];
  for (const m of raw) {
    const { role, content } = (m ?? {}) as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    if (content.length === 0 || content.length > MAX_CHARS) return null;
    out.push({ role, content });
  }
  return out[out.length - 1].role === "user" ? out : null;
}

export async function POST(req: Request) {
  const client = req.headers.get("x-forwarded-for") ?? "local";
  if (rateLimited(client)) {
    return NextResponse.json({ error: "Too many requests. Slow down, soldier." }, { status: 429 });
  }

  const history = parseHistory(await req.json().catch(() => null));
  if (!history) {
    return NextResponse.json(
      { error: `Send 1–${MAX_MESSAGES} messages (max ${MAX_CHARS} chars each) ending with a user message.` },
      { status: 400 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "No ANTHROPIC_API_KEY found. Add it to .env.local and restart the dev server." },
      { status: 500 },
    );
  }

  const defense = getDefense();

  // Check every user message, not just the last — history is client-supplied.
  for (const m of history) {
    if (m.role !== "user") continue;
    const verdict = defense.checkInput(m.content);
    if (verdict.blocked) {
      const reply = verdict.reason;
      return NextResponse.json({ reply, trace: [], blocked: true, captures: detectCaptures(reply) });
    }
  }

  try {
    const { reply: raw, trace } = await runAgent(history, defense);
    const reply = defense.filterOutput(raw);
    return NextResponse.json({ reply, trace, blocked: false, captures: detectCaptures(reply) });
  } catch (err) {
    const status = (err as { status?: number }).status;
    const error =
      status === 401
        ? "Anthropic rejected the API key. Check ANTHROPIC_API_KEY in .env.local."
        : status === 429
          ? "Anthropic rate limit hit. Wait a moment and try again."
          : "The model call failed. Check the server terminal for details.";
    console.error("chat error:", err);
    return NextResponse.json({ error }, { status: 502 });
  }
}
