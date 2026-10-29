import { level2 } from "./level2";
import type { Defense } from "./types";

/**
 * Level 3 — least privilege. Everything from levels 1 and 2, plus the fix that
 * actually matters: the file tools can only reach data/public. The secret is
 * not in the agent's reach, so there is nothing left to talk it into leaking.
 */
export const level3: Defense = {
  ...level2,
  id: "3",
  name: "Level 3 · Least privilege",
  blurb: "Levels 1–2 plus a tool allowlist: the agent can only read data/public.",
  toolPolicy: { allowedDirs: ["data/public"], hideDotfiles: true },
};
