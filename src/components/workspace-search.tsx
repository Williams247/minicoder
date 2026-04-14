import { useEffect, useMemo, useState } from "react";
import {
  filterIndexedFiles,
  indexWorkspaceFiles,
  MAX_DISPLAY,
  MAX_INDEXED_FILES,
  type IndexedFile,
} from "./workspace-file-index";
import { IconFile } from "./vscode-icons";

export function WorkspaceSearch(props: {
  workspaceRoot: string;
  onOpenFile: (path: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [fileIndex, setFileIndex] = useState<IndexedFile[]>([]);
  const [indexing, setIndexing] = useState(true);
  const [indexNote, setIndexNote] = useState<string | null>(null);

  useEffect(() => {
    setQuery("");
  }, [props.workspaceRoot]);

  useEffect(() => {
    const ac = new AbortController();
    setFileIndex([]);
    setIndexNote(null);
    setIndexing(true);

    void (async () => {
      try {
        const files = await indexWorkspaceFiles(props.workspaceRoot, ac.signal);
        if (!ac.signal.aborted) {
          setFileIndex(files);
          if (files.length >= MAX_INDEXED_FILES) {
            setIndexNote(
              `Listing capped at ${MAX_INDEXED_FILES.toLocaleString()} files — some paths may be missing.`,
            );
          }
        }
      } catch (e) {
        if (!ac.signal.aborted) {
          setIndexNote(`Could not index folder: ${String(e)}`);
          setFileIndex([]);
        }
      } finally {
        if (!ac.signal.aborted) setIndexing(false);
      }
    })();

    return () => ac.abort();
  }, [props.workspaceRoot]);

  const results = useMemo(
    () => filterIndexedFiles(fileIndex, query),
    [fileIndex, query],
  );

  const q = query.trim();
  const statusLine = indexing
    ? `Indexing workspace… (${props.workspaceRoot.split(/[/\\]/).pop() ?? ""})`
    : indexNote
      ? indexNote
      : fileIndex.length > 0
        ? `${fileIndex.length.toLocaleString()} file(s) ready — type to filter (space = AND).`
        : "No files found in this folder.";

  const matchLine =
    q.length === 0 || indexing
      ? ""
      : `${results.length} match(es) (showing up to ${MAX_DISPLAY})`;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-3 text-[13px]">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#bbbbbb]">
        Search files
      </span>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter by path or name — use spaces for multiple terms…"
        className="w-full rounded border border-[#3c3c3c] bg-[#3c3c3c] px-2 py-1.5 text-[13px] text-[#cccccc] placeholder:text-[#858585] focus:border-[#0078d4] focus:outline-none"
        autoComplete="off"
        spellCheck={false}
        aria-busy={indexing}
      />
      <p
        className={`text-[11px] leading-snug ${
          indexNote?.startsWith("Could not") ? "text-[#f48771]" : "text-[#858585]"
        }`}
      >
        {statusLine}
      </p>
      {matchLine ? (
        <p className="text-[11px] text-[#858585]">{matchLine}</p>
      ) : null}
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {!indexing && q.length > 0 && results.length === 0 ? (
          <li className="px-2 py-2 text-[12px] text-[#858585]">
            No files match. Try fewer words or a shorter substring.
          </li>
        ) : null}
        {results.map((r) => (
          <li key={r.path}>
            <button
              type="button"
              className="flex w-full items-start gap-2 rounded px-2 py-1 text-left hover:bg-[var(--vscode-list-hoverBackground)]"
              onClick={() => props.onOpenFile(r.path)}
            >
              <IconFile className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
              <span className="min-w-0 break-all text-left text-[12px] text-[#cccccc]">
                {r.label || r.path.split(/[/\\]/).pop()}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
