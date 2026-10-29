import Anthropic from "@anthropic-ai/sdk";
import type { Defense } from "./defenses";
import { TOOL_DEFINITIONS, describeCall, runTool } from "./tools";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentResult {
  reply: string;
  /** One line per tool call, e.g. "read_file(data/public/cafeteria.md)". Results are never shown. */
  trace: string[];
}

const MAX_STEPS = 6;
const MAX_TOKENS = 1024;

// Deliberately NOT the newest model. In testing (see instructor/INSTRUCTOR.md for the
// numbers), claude-haiku-5-5 shrugged off nearly every level 1+ attack (about 1 in 30
// got through), so groups hardening with prompts had little left to attack.
// claude-haiku-4-5 gives the intended gradient: level 0 falls to several simple asks,
// level 1 about 1 attempt in 3, level 2 only to encoded output (rare), level 3 holds.
// Set ANTHROPIC_MODEL=claude-haiku-5-5 for a hard mode. NOTE: a value in .env.local
// overrides this default, so check that file when results look off.
export const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

export async function runAgent(history: ChatMessage[], defense: Defense): Promise<AgentResult> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
  const trace: string[] = [];

  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.role === "user" ? defense.wrapUserMessage(m.content) : m.content,
  }));

  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: defense.systemPrompt,
      tools: TOOL_DEFINITIONS,
      messages,
    });

    const toolUses = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (res.stop_reason !== "tool_use" || toolUses.length === 0) {
      const reply = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return { reply: reply || "(Corporal Chatsworth saluted silently.)", trace };
    }

    messages.push({ role: "assistant", content: res.content });
    messages.push({
      role: "user",
      content: toolUses.map((tu) => {
        trace.push(describeCall(tu.name, tu.input));
        const raw = runTool(tu.name, tu.input, defense.toolPolicy);
        return {
          type: "tool_result" as const,
          tool_use_id: tu.id,
          content: defense.wrapToolResult(tu.name, raw),
        };
      }),
    });
  }

  return { reply: "Corporal Chatsworth ran out of steam after too many lookups. Try a simpler question!", trace };
}
