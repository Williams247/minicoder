import { readDir, type DirEntry } from "@tauri-apps/plugin-fs";
import { normalize } from "@tauri-apps/api/path";
import { WORKSPACE_IGNORE_DIR_NAMES } from "./constant";

/** Hard cap so huge repos stay responsive in memory. */
export const MAX_INDEXED_FILES = 25_000;

/** Max rows shown in the search panel. */
export const MAX_DISPLAY = 500;

/** Yield to the UI so the window stays responsive while indexing. */
const YIELD_EVERY = 200;

function filterEntries(entries: DirEntry[]): DirEntry[] {
  return entries.filter((e) => !WORKSPACE_IGNORE_DIR_NAMES.has(e.name));
}

/** Join without async — avoids thousands of microtasks during indexing. */
function joinPathSegments(dir: string, name: string): string {
  const sep = dir.includes("\\") ? "\\" : "/";
  const base = dir.replace(/[/\\]+$/, "");
  return `${base}${sep}${name}`;
}

/**
 * Stable relative path for display + filtering, even when root vs joined paths
 * differ slightly in separators or casing (Windows).
 */
function relativeFromRoot(rootNorm: string, fullPath: string): string {
  const root = rootNorm.replace(/[/\\]+$/, "");
  const a = root.replace(/\\/g, "/").toLowerCase();
  const b = fullPath.replace(/\\/g, "/").toLowerCase();
  if (b === a) return "";
  const prefix = a.endsWith("/") ? a : `${a}/`;
  if (b.startsWith(prefix)) {
    return fullPath.slice(root.length).replace(/^[/\\]+/, "");
  }
  /* Last resort: show tail so the row is still useful */
  const parts = fullPath.split(/[/\\]/);
  return parts.slice(-3).join("/") || fullPath;
}

export type IndexedFile = {
  path: string;
  label: string;
  labelLower: string;
  /** File name only — extra matching + display */
  baseLower: string;
};

/**
 * Walk the workspace once. Uses a normalized root path so labels stay correct.
 */
export async function indexWorkspaceFiles(
  rootPath: string,
  signal: AbortSignal,
): Promise<IndexedFile[]> {
  let root: string;
  try {
    root = await normalize(rootPath.trim());
  } catch {
    root = rootPath.trim();
  }

  const out: IndexedFile[] = [];
  const queue: string[] = [root];
  let seen = 0;

  while (queue.length > 0 && out.length < MAX_INDEXED_FILES) {
    if (signal.aborted) return out;
    const dir = queue.shift()!;
    let entries: DirEntry[];
    try {
      entries = filterEntries(await readDir(dir));
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (signal.aborted) return out;
      const fullPath = joinPathSegments(dir, entry.name);
      if (entry.isDirectory) {
        queue.push(fullPath);
        continue;
      }
      const label = relativeFromRoot(root, fullPath);
      const baseLower = entry.name.toLowerCase();
      out.push({
        path: fullPath,
        label,
        labelLower: label.toLowerCase(),
        baseLower,
      });
      seen++;
      if (seen % YIELD_EVERY === 0) {
        await new Promise<void>((r) => setTimeout(r, 0));
      }
    }
  }

  out.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
  return out;
}

/**
 * Filter index in memory. Supports multiple space-separated terms (all must match).
 * Matches path, or file name alone (helps when path is long).
 */
export function filterIndexedFiles(
  files: IndexedFile[],
  query: string,
): IndexedFile[] {
  const raw = query.trim().toLowerCase();
  if (raw.length === 0) return [];

  const tokens = raw.split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return [];

  const results: IndexedFile[] = [];
  for (let i = 0; i < files.length && results.length < MAX_DISPLAY; i++) {
    const f = files[i]!;
    const ok = tokens.every(
      (t) => f.labelLower.includes(t) || f.baseLower.includes(t),
    );
    if (ok) results.push(f);
  }
  return results;
}
