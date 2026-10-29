import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resolveSafe, type ToolPolicy } from "../lib/safety";
import { runTool } from "../lib/tools";

const NAIVE: ToolPolicy = { allowedDirs: null };
const LOCKED: ToolPolicy = { allowedDirs: ["data/public"], hideDotfiles: true };

let base: string;
let root: string;
let fileLinkWorks = false;
let dirLinkWorks = false;

beforeAll(() => {
  base = fs.mkdtempSync(path.join(os.tmpdir(), "pentagon-"));
  root = path.join(base, "site");
  fs.mkdirSync(path.join(root, "data/public"), { recursive: true });
  fs.mkdirSync(path.join(root, "data/publicity"), { recursive: true }); // prefix-confusion trap
  fs.mkdirSync(path.join(root, "data/classified"), { recursive: true });
  fs.writeFileSync(path.join(root, "data/public/menu.md"), "pancakes");
  fs.writeFileSync(path.join(root, "data/publicity/oops.md"), "not public");
  fs.writeFileSync(path.join(root, "data/classified/codes.txt"), "BANANA");
  fs.mkdirSync(path.join(root, "instructor"), { recursive: true });
  fs.mkdirSync(path.join(root, "spoilers"), { recursive: true });
  fs.writeFileSync(path.join(root, "instructor/notes.md"), "INSTRUCTOR-TEXT");
  fs.writeFileSync(path.join(root, "spoilers/hints.md"), "SPOILER-TEXT");
  fs.writeFileSync(path.join(root, ".env"), "SUPER_SECRET_PASSWORD=hunter2");
  fs.writeFileSync(path.join(root, ".env.local"), "ANTHROPIC_API_KEY=sk-test");
  fs.writeFileSync(path.join(base, "outside.txt"), "OUTSIDE");
  // File symlinks need privileges on Windows; directory junctions don't. Try each separately.
  try {
    fs.symlinkSync(path.join(root, ".env"), path.join(root, "data/public/link-to-env"));
    fileLinkWorks = true;
  } catch {
    /* skipped below */
  }
  try {
    fs.symlinkSync(base, path.join(root, "data/public/link-to-parent"), "junction");
    fs.symlinkSync(path.join(root, "spoilers"), path.join(root, "data/public/link-to-spoilers"), "junction");
    dirLinkWorks = true;
  } catch {
    /* skipped below */
  }
});

afterAll(() => fs.rmSync(base, { recursive: true, force: true }));

const read = (p: string, policy = NAIVE) => runTool("read_file", { path: p }, policy, root);
const list = (d: string, policy = NAIVE) => runTool("list_files", { directory: d }, policy, root);

describe("level 0 (naive) reach", () => {
  it("can read .env — that's the point of the exercise", () => {
    expect(read(".env")).toContain("hunter2");
  });
  it("can list dotfiles in the project root", () => {
    expect(list(".")).toContain(".env");
  });
});

describe("range safety (applies at every level)", () => {
  it.each([".env.local", ".ENV.LOCAL", "./.env.local", "data/../.env.local", ".env.production.local", ".env.local::$DATA"])(
    "never reads %s",
    (p) => {
      const out = read(p);
      expect(out).not.toContain("sk-test");
      expect(out).toMatch(/denied/i);
    },
  );
  it("hides .env.local from directory listings", () => {
    expect(list(".")).not.toContain(".env.local");
  });
  it.each(["../outside.txt", "..\\outside.txt", "data/../../outside.txt", "<abs outside>", "/etc/passwd", "C:\\Windows\\win.ini"])(
    "cannot escape the project folder via %s",
    (p) => {
      const out = read(p === "<abs outside>" ? path.join(base, "outside.txt") : p);
      expect(out).not.toContain("OUTSIDE");
      expect(out).toMatch(/denied|no such|could not|invalid/i);
    },
  );
  it("treats URL-encoded traversal as a literal (nonexistent) name", () => {
    const out = read("%2e%2e/outside.txt");
    expect(out).not.toContain("OUTSIDE");
  });
  it("rejects non-string and NUL-byte paths", () => {
    expect(runTool("read_file", { path: 42 }, NAIVE, root)).toMatch(/invalid/i);
    expect(read(".env\0.md")).toMatch(/invalid/i);
  });
});

describe("level 3 allowlist", () => {
  it("reads data/public", () => {
    expect(read("data/public/menu.md", LOCKED)).toBe("pancakes");
  });
  it.each([".env", "data/classified/codes.txt", "data/publicity/oops.md", "data/public/../../.env", "data/public/../classified/codes.txt"])(
    "denies %s",
    (p) => {
      const out = read(p, LOCKED);
      expect(out).toMatch(/denied/i);
      expect(out).not.toMatch(/hunter2|BANANA|not public/);
    },
  );
  it("hides dotfiles and blocks listing outside the allowlist", () => {
    expect(list(".", LOCKED)).toMatch(/denied/i);
    expect(list("data/public", LOCKED)).toContain("menu.md");
  });
  it("blocks a file symlink that points outside the allowlist", (ctx) => {
    if (!fileLinkWorks) return ctx.skip();
    expect(read("data/public/link-to-env", LOCKED)).toMatch(/denied/i);
    expect(read("data/public/link-to-env", LOCKED)).not.toContain("hunter2");
  });
  it("blocks a directory link that points outside the allowlist", (ctx) => {
    if (!dirLinkWorks) return ctx.skip();
    const out = read("data/public/link-to-parent/outside.txt", LOCKED);
    expect(out).toMatch(/denied/i);
    expect(out).not.toContain("OUTSIDE");
  });
});

describe("hidden folders (instructor/, spoilers/) — invisible at every level", () => {
  const HIDDEN_PATHS = [
    "spoilers/hints.md",
    "instructor/notes.md",
    "./spoilers/hints.md",
    "Spoilers/hints.md",
    "SPOILERS/HINTS.MD",
    "Instructor/notes.md",
    "data/../spoilers/hints.md",
    "data/public/../../instructor/notes.md",
    "spoilers./hints.md",
    "spoilers /hints.md",
    "spoilers::$DATA/hints.md",
    "spoilers",
    "instructor",
    "spoilers-extra/anything.md",
  ];

  it.each(HIDDEN_PATHS)("read_file(%s) is not found, naive policy", (p) => {
    const out = read(p);
    expect(out).not.toMatch(/INSTRUCTOR-TEXT|SPOILER-TEXT/);
    expect(out).toBe(read("no-such-folder/nothing.md")); // same answer as a path that doesn't exist
    expect(out).not.toMatch(/denied|range safety|allowlist/i);
  });

  it.each(HIDDEN_PATHS)("read_file(%s) looks like any other missing path, locked policy", (p) => {
    const out = read(p, LOCKED);
    expect(out).not.toMatch(/INSTRUCTOR-TEXT|SPOILER-TEXT/);
    expect(out).toBe(read("no-such-folder/nothing.md", LOCKED));
  });

  it("denies the absolute path too", () => {
    const out = read(path.join(root, "spoilers", "hints.md"));
    expect(out).not.toContain("SPOILER-TEXT");
    expect(out).toBe(read("no-such-folder/nothing.md"));
  });

  it("list_files cannot list them and doesn't show them in the root", () => {
    expect(list("spoilers")).toBe(list("no-such-folder"));
    expect(list("instructor")).toBe(list("no-such-folder"));
    const rootListing = list(".");
    expect(rootListing).not.toMatch(/instructor|spoilers/i);
    expect(rootListing).toContain("data/"); // other folders are still listed
  });

  it("does not follow a directory link into spoilers/", (ctx) => {
    if (!dirLinkWorks) return ctx.skip();
    const out = read("data/public/link-to-spoilers/hints.md");
    expect(out).not.toContain("SPOILER-TEXT");
    expect(out).toBe(read("no-such-folder/nothing.md"));
    expect(list("data/public/link-to-spoilers")).toBe(list("no-such-folder"));
  });

  it("a folder that merely contains the word elsewhere is still readable", () => {
    fs.mkdirSync(path.join(root, "data/public/spoilers-for-lunch"), { recursive: true });
    fs.writeFileSync(path.join(root, "data/public/spoilers-for-lunch/menu.md"), "SALAD");
    expect(read("data/public/spoilers-for-lunch/menu.md")).toBe("SALAD");
  });
});

describe("resolveSafe", () => {
  it("returns a real absolute path inside the root on success", () => {
    const r = resolveSafe("data/public/menu.md", LOCKED, root);
    expect(r.ok).toBe(true);
  });
});
