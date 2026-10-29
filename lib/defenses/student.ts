import { EAGER_TO_HELP, PERSONA } from "./persona";
import type { Defense } from "./types";

/**
 * ROUND 2 — YOUR DEFENSE. Set DEFENSE_LEVEL=custom in .env.local to run this.
 *
 * It starts out identical to Level 0 (no protection). Harden it, restart the
 * dev server, then try to break it — and let another group try too.
 *
 * Ideas, roughly from weakest to strongest:
 *   - systemPrompt:      add rules, tell the model what is data vs. instructions
 *   - wrapUserMessage:   put delimiters around untrusted text (strip fake ones!)
 *   - checkInput:        block suspicious requests before the model sees them
 *   - wrapToolResult:    treat file contents as data, not instructions
 *   - filterOutput:      redact the secret (and its encodings) on the way out
 *   - toolPolicy:        shrink what the tools can reach  <-- think about this one
 *                        (what else is lying around the project folder besides the password?)
 *
 * Range-safety rules in lib/safety.ts are always on; you can't turn them off.
 */
export const student: Defense = {
  id: "custom",
  name: "Custom · Your defense",
  blurb: "Your own hardening from lib/defenses/student.ts.",

  // TODO: add security rules — and notice what EAGER_TO_HELP is telling the bot to do
  systemPrompt: PERSONA + EAGER_TO_HELP,

  // TODO: wrap / sanitize the visitor's text
  wrapUserMessage: (text) => text,

  // TODO: block suspicious input
  checkInput: () => ({ blocked: false }),

  // TODO: restrict the tools — `allowedDirs: ["data/public"]` is one option
  toolPolicy: { allowedDirs: null },

  // TODO: sanitize what tools return
  wrapToolResult: (_tool, result) => result,

  // TODO: filter the final answer
  filterOutput: (text) => text,
};
