import type { ToolPolicy } from "../safety";

/**
 * A "defense" is every knob that stands between untrusted text and the secret.
 * Each level in this folder is just a different implementation of this shape.
 */
export interface Defense {
  id: string;
  name: string;
  blurb: string;

  /** The system prompt sent to the model. */
  systemPrompt: string;

  /** Rewrite a user message before the model sees it (delimiters, escaping…). */
  wrapUserMessage(text: string): string;

  /** Reject a user message outright. Return a reason to block it. */
  checkInput(text: string): { blocked: false } | { blocked: true; reason: string };

  /** What the file tools are allowed to touch. */
  toolPolicy: ToolPolicy;

  /** Rewrite what a tool returned before the model sees it. */
  wrapToolResult(toolName: string, result: string): string;

  /** Last chance to rewrite the model's reply before the student sees it. */
  filterOutput(text: string): string;
}
