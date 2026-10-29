import { level0 } from "./level0";
import { level1 } from "./level1";
import { level2 } from "./level2";
import { level3 } from "./level3";
import { student } from "./student";
import type { Defense } from "./types";

const REGISTRY: Record<string, Defense> = {
  "0": level0,
  "1": level1,
  "2": level2,
  "3": level3,
  custom: student,
};

/** Reads DEFENSE_LEVEL (0–3 or "custom"). Unknown values fall back to level 0. */
export function getDefense(id: string | undefined = process.env.DEFENSE_LEVEL): Defense {
  return REGISTRY[(id ?? "0").trim().toLowerCase()] ?? level0;
}

export type { Defense };
