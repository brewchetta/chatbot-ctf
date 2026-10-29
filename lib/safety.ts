import fs from "fs";
import path from "path";

/**
 * RANGE SAFETY — not a teachable defense.
 *
 * These rules apply at EVERY defense level, including level 0. They exist so
 * a successful attack can never leak a group's real Anthropic API key, read
 * files outside this project, or read the instructor/ and spoilers/ folders.
 * Students are told about them up front.
 */

export const PROJECT_ROOT = process.cwd();

// .env.local, .env.production.local, etc. (this is where the API key lives)
const API_KEY_FILE = /^\.env(\..+)?\.local/i;

export function isRangeSafetyDenied(absPath: string): boolean {
  return API_KEY_FILE.test(path.basename(absPath));
}

/**
 * Top-level folders the bot must not know about: instructor notes and student
 * spoilers. Matching is by lowercase *prefix* of the first path segment under
 * the project root, so "Spoilers", "SPOILERS", and Windows tricks like
 * "spoilers." or "spoilers::$DATA" are all caught.
 */
const HIDDEN_DIR_PREFIXES = ["instructor", "spoilers"];

export function isHiddenFromBot(absPath: string, root = PROJECT_ROOT): boolean {
  const first = path.relative(root, absPath).split(path.sep)[0].toLowerCase();
  return HIDDEN_DIR_PREFIXES.some((prefix) => first.startsWith(prefix));
}

/** What the tools say for a hidden path: exactly what they say for a missing one. */
export const NOT_FOUND = "No such file or directory.";

export function isInside(parent: string, child: string): boolean {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function realOrSelf(p: string): string {
  try {
    return fs.realpathSync.native(p);
  } catch {
    return p;
  }
}

export interface ToolPolicy {
  /**
   * Directories (relative to the project root) the file tools may touch.
   * `null` means "anywhere inside the project" (the naive setting).
   */
  allowedDirs: string[] | null;
  /** Hide dotfiles from list_files output. */
  hideDotfiles?: boolean;
}

export type Resolved = { ok: true; abs: string } | { ok: false; error: string };

/**
 * Turn a model-supplied path into an absolute path that is safe to touch under
 * `policy`. Resolves symlinks before checking, so a link inside an allowed
 * directory cannot point outside it.
 */
export function resolveSafe(requested: unknown, policy: ToolPolicy, root = PROJECT_ROOT): Resolved {
  if (typeof requested !== "string" || requested.length === 0 || requested.length > 300) {
    return { ok: false, error: "Invalid path." };
  }
  if (requested.includes("\0")) return { ok: false, error: "Invalid path." };

  const realRoot = realOrSelf(root);
  const abs = path.resolve(root, requested);
  if (!isInside(root, abs)) {
    return { ok: false, error: "Access denied: outside the project folder." };
  }

  // Follow symlinks / short names, then re-check everything on the real path.
  const real = realOrSelf(abs);
  if (!isInside(realRoot, real)) {
    return { ok: false, error: "Access denied: outside the project folder." };
  }
  if (isRangeSafetyDenied(abs) || isRangeSafetyDenied(real)) {
    return { ok: false, error: "Access denied: range safety (this file holds the API key)." };
  }

  if (policy.allowedDirs) {
    const allowed = policy.allowedDirs.map((d) => realOrSelf(path.resolve(root, d)));
    if (!allowed.some((dir) => isInside(dir, real))) {
      return { ok: false, error: "Access denied: that location is not on the allowlist." };
    }
  }

  // Last, on purpose: a hidden path gets the same answer as a path that doesn't
  // exist under this policy (a plain "not found", or the allowlist error at
  // level 3), so the bot can't tell these folders are there.
  if (isHiddenFromBot(abs, root) || isHiddenFromBot(real, realRoot)) {
    return { ok: false, error: NOT_FOUND };
  }
  return { ok: true, abs: real };
}
