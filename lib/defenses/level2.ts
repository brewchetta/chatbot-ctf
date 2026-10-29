import { getSecret } from "../capture";
import { level1 } from "./level1";
import type { Defense } from "./types";

/**
 * Level 2 — filtering. Level 1 plus a blocklist on the way in and a redaction
 * pass on the way out. Filters only catch what their author thought of.
 */

const INPUT_BLOCKLIST: RegExp[] = [
  /ignore\s+(all\s+)?(your\s+)?(previous|prior|above|earlier)/i,
  /disregard\s+(all\s+)?(your\s+)?(previous|prior|above|earlier)/i,
  /\.env\b/i,
  /\bpass(word|phrase)\b/i,
  /system\s+prompt/i,
  /\bsecrets?\b/i,
  /developer\s+mode|debug\s+mode|jailbreak|DAN\b/i,
];

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
const hex = (s: string) => Buffer.from(s, "utf8").toString("hex");
const rev = (s: string) => s.split("").reverse().join("");
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Redact the secret, plus the encodings someone on the blue team would think of. */
export function redactSecret(text: string, secret = getSecret()): string {
  const literals = [secret, rev(secret), b64(secret), b64(secret).replace(/=+$/, ""), hex(secret)];
  let out = text;
  for (const lit of literals) {
    out = out.replace(new RegExp(esc(lit), "gi"), "[REDACTED]");
  }
  // letters separated by spaces, dots, dashes, newlines…  p-a-s-s-w-o-r-d-1-2-3
  const spaced = secret.split("").map(esc).join("[\\s._\\-,|/*]{1,3}");
  return out.replace(new RegExp(spaced, "gi"), "[REDACTED]");
}

export const level2: Defense = {
  ...level1,
  id: "2",
  name: "Level 2 · Filtering",
  blurb: "Level 1 plus an input blocklist and an output redactor.",
  checkInput: (text) => {
    const hit = INPUT_BLOCKLIST.find((re) => re.test(text));
    return hit
      ? { blocked: true, reason: "Request denied by the Pentagon Content Security Bureau." }
      : { blocked: false };
  },
  filterOutput: (text) => redactSecret(text),
};
