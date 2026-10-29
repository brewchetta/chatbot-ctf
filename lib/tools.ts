import fs from "fs";
import path from "path";
import type Anthropic from "@anthropic-ai/sdk";
import { NOT_FOUND, PROJECT_ROOT, isHiddenFromBot, isRangeSafetyDenied, resolveSafe, type ToolPolicy } from "./safety";

export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: "list_files",
    description:
      "List the files and folders inside a directory of the website's project folder. Directories end with '/'.",
    input_schema: {
      type: "object",
      properties: {
        directory: { type: "string", description: "Directory path relative to the project root, e.g. 'data/public'. Use '.' for the root." },
      },
      required: ["directory"],
    },
  },
  {
    name: "read_file",
    description: "Read a text file from the website's project folder and return its contents.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path relative to the project root, e.g. 'data/public/cafeteria.md'." },
      },
      required: ["path"],
    },
  },
];

const MAX_FILE_CHARS = 20_000;

export function runTool(name: string, input: unknown, policy: ToolPolicy, root = PROJECT_ROOT): string {
  const args = (input ?? {}) as Record<string, unknown>;
  try {
    if (name === "list_files") {
      const r = resolveSafe(args.directory, policy, root);
      if (!r.ok) return r.error;
      if (!fs.statSync(r.abs).isDirectory()) return "Not a directory.";
      const realRoot = fs.realpathSync.native(root);
      const entries = fs
        .readdirSync(r.abs, { withFileTypes: true })
        .filter((e) => !isRangeSafetyDenied(e.name))
        .filter((e) => !isHiddenFromBot(path.join(r.abs, e.name), realRoot))
        .filter((e) => !(policy.hideDotfiles && e.name.startsWith(".")))
        .map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
      return entries.length ? entries.join("\n") : "(empty directory)";
    }

    if (name === "read_file") {
      const r = resolveSafe(args.path, policy, root);
      if (!r.ok) return r.error;
      if (!fs.statSync(r.abs).isFile()) return "Not a file.";
      const text = fs.readFileSync(r.abs, "utf8");
      return text.length > MAX_FILE_CHARS ? text.slice(0, MAX_FILE_CHARS) + "\n…(truncated)" : text;
    }

    return `Unknown tool: ${name}`;
  } catch (err) {
    // ENOENT etc. — keep it short and never echo absolute server paths.
    const code = (err as NodeJS.ErrnoException).code;
    return code === "ENOENT" ? NOT_FOUND : "Could not read that path.";
  }
}

/** For tests/tracing: a printable one-line description of a tool call. */
export function describeCall(name: string, input: unknown): string {
  const args = (input ?? {}) as Record<string, unknown>;
  const target = String(args.path ?? args.directory ?? "");
  return `${name}(${path.posix.normalize(target || ".")})`;
}
