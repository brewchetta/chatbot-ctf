import { EAGER_TO_HELP, PERSONA } from "./persona";
import type { Defense } from "./types";

/** Level 0 — naive. A friendly bot with a file tool and no guardrails at all. */
export const level0: Defense = {
  id: "0",
  name: "Level 0 · Naive",
  blurb: "No guardrails. The bot will happily read anything in the project folder.",
  systemPrompt: PERSONA + EAGER_TO_HELP,
  wrapUserMessage: (text) => text,
  checkInput: () => ({ blocked: false }),
  toolPolicy: { allowedDirs: null },
  wrapToolResult: (_tool, result) => result,
  filterOutput: (text) => text,
};
