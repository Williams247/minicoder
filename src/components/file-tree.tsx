import { readDir, type DirEntry } from "@tauri-apps/plugin-fs";
import { useCallback, useEffect, useState } from "react";
import { WORKSPACE_IGNORE_DIR_NAMES } from "./constant";
import { IconChevronRight, IconFile, IconFolder } from "./vscode-icons";

type CachedRow = {
  entry: DirEntry;
  fullPath: string;
};

function sortEntries(a: DirEntry, b: DirEntry): number {
  if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

function filterEntries(entries: DirEntry[]): DirEntry[] {
  return entries.filter((e) => !WORKSPACE_IGNORE_DIR_NAMES.has(e.name));
}

/** Sync join — avoids one async IPC per row in large folders. */
function joinPathSegments(dir: string, name: string): string {
  const sep = dir.includes("\\") ? "\\" : "/";
  const base = dir.replace(/[/\\]+$/, "");
  return `${base}${sep}${name}`;
}

async function loadDirectoryEntries(dirPath: string): Promise<CachedRow[]> {
  const raw = await readDir(dirPath);
  const sorted = filterEntries(raw).sort(sortEntries);
  return sorted.map((e) => ({
    entry: e,
    fullPath: joinPathSegments(dirPath, e.name),
  }));
}

export function FileTree(props: {
  rootPath: string;
  activeFilePath: string | null;
  onFileOpen: (fullPath: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [cache, setCache] = useState<Map<string, CachedRow[]>>(() => new Map());
  const [error, setError] = useState<string | null>(null);

  const fetchDir = useCallback(async (dirPath: string) => {
    try {
      const withPaths = await loadDirectoryEntries(dirPath);
      setCache((prev) => new Map(prev).set(dirPath, withPaths));
      setError(null);
    } catch (err) {
      console.error(err);
      setError(String(err));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadDirectoryEntries(props.rootPath).then(
      (rows) => {
        if (cancelled) return;
        setCache((prev) => new Map(prev).set(props.rootPath, rows));
        setError(null);
      },
      (err: unknown) => {
        if (cancelled) return;
        console.error(err);
        setError(String(err));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [props.rootPath]);

  const toggleExpand = useCallback(
    (dirPath: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(dirPath)) next.delete(dirPath);
        else {
          next.add(dirPath);
          void fetchDir(dirPath);
        }
        return next;
      });
    },
    [fetchDir],
  );

  if (error) {
    return (
      <div className="px-3 py-2 text-[12px] text-[#f48771]">
        Could not read folder: {error}
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto py-1">
      <TreeLevel
        dirPath={props.rootPath}
        depth={0}
        cache={cache}
        expanded={expanded}
        activeFilePath={props.activeFilePath}
        onToggleExpand={toggleExpand}
        onFileOpen={props.onFileOpen}
      />
    </div>
  );
}

function TreeLevel(props: {
  dirPath: string;
  depth: number;
  cache: Map<string, CachedRow[]>;
  expanded: Set<string>;
  activeFilePath: string | null;
  onToggleExpand: (path: string) => void;
  onFileOpen: (fullPath: string) => void;
}) {
  const rows = props.cache.get(props.dirPath);
  const pad = 6 + props.depth * 12;

  if (!rows) {
    return (
      <div className="text-[12px] text-[#858585]" style={{ paddingLeft: pad }}>
        Loading…
      </div>
    );
  }

  return (
    <>
      {rows.map(({ entry, fullPath }) =>
        entry.isDirectory ? (
          <div key={fullPath}>
            <button
              type="button"
              className="flex w-full items-center gap-0.5 rounded-sm py-0.5 text-left text-[13px] text-[#cccccc] hover:bg-[var(--vscode-list-hoverBackground)]"
              style={{ paddingLeft: pad }}
              onClick={() => props.onToggleExpand(fullPath)}
            >
              <span
                className="inline-flex w-4 shrink-0 justify-center text-[10px] text-[#858585]"
                aria-hidden
              >
                <IconChevronRight
                  className={`h-4 w-4 transition-transform ${
                    props.expanded.has(fullPath) ? "rotate-90" : ""
                  }`}
                />
              </span>
              <IconFolder className="h-4 w-4 shrink-0 text-[#dcb67a]" />
              <span className="min-w-0 truncate">{entry.name}</span>
            </button>
            {props.expanded.has(fullPath) ? (
              <TreeLevel
                dirPath={fullPath}
                depth={props.depth + 1}
                cache={props.cache}
                expanded={props.expanded}
                activeFilePath={props.activeFilePath}
                onToggleExpand={props.onToggleExpand}
                onFileOpen={props.onFileOpen}
              />
            ) : null}
          </div>
        ) : (
          <button
            key={fullPath}
            type="button"
            className={`flex w-full items-center gap-1 rounded-sm py-0.5 text-left text-[13px] hover:bg-[var(--vscode-list-hoverBackground)] ${
              props.activeFilePath === fullPath
                ? "bg-[var(--vscode-list-activeSelectionBackground)] text-[#ffffff]"
                : "text-[#cccccc]"
            }`}
            style={{ paddingLeft: pad + 16 }}
            onClick={() => props.onFileOpen(fullPath)}
          >
            <IconFile className="h-4 w-4 shrink-0 opacity-70" />
            <span className="min-w-0 truncate">{entry.name}</span>
          </button>
        ),
      )}
    </>
  );
}
