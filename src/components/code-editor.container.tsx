import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { open, save, message } from "@tauri-apps/plugin-dialog";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CodeEditor } from "./code-editor";
import { fileExtensionFilters } from "./constant";
import { FileTree } from "./file-tree";
import { ACE_MODE_LABELS } from "./language-labels";
import type { EditorMetrics, EditorTab, SupportedMode } from "./type";
import { Workbench } from "./workbench";
import { WorkspaceSearch } from "./workspace-search";
import { IconFiles, IconFile, IconSearch } from "./vscode-icons";

function fileBasename(path: string | null): string {
  if (!path) return "Untitled";
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || "Untitled";
}

function shortcutLabel(key: string): string {
  const isApple =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
  return isApple ? `⌘${key}` : `Ctrl+${key}`;
}

function shortcutOpenFolder(): string {
  const isApple =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
  return isApple ? "⇧⌘O" : "Ctrl+Shift+O";
}

function newEmptyTab(): EditorTab {
  return {
    id: crypto.randomUUID(),
    filePath: null,
    content: "",
    baseline: "",
  };
}

export function CodeEditorContainer() {
  const bootstrap = useMemo(() => {
    const t = newEmptyTab();
    return { firstId: t.id, initialTabs: [t] };
  }, []);

  const [tabs, setTabs] = useState<EditorTab[]>(bootstrap.initialTabs);
  const [activeTabId, setActiveTabId] = useState(bootstrap.firstId);
  const [workspaceRoot, setWorkspaceRoot] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<EditorMetrics>({
    line: 1,
    column: 1,
    totalLines: 1,
  });
  const [activeMode, setActiveMode] = useState<SupportedMode>("javascript");
  const [activity, setActivity] = useState<"files" | "search">("files");

  const tabsRef = useRef(tabs);
  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]!;

  const onEditorMetrics = useCallback((m: EditorMetrics) => {
    setMetrics(m);
  }, []);

  const onActiveMode = useCallback((mode: SupportedMode) => {
    setActiveMode(mode);
  }, []);

  const setActiveContent = useCallback(
    (content: string) => {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId ? { ...t, content } : t,
        ),
      );
    },
    [activeTabId],
  );

  const confirmDiscardAllTabs = useCallback(async (tabList: EditorTab[]) => {
    const dirty = tabList.filter((t) => t.content !== t.baseline);
    if (dirty.length === 0) return true;
    const result = await message(
      `You have ${dirty.length} unsaved file(s). Discard all changes?`,
      {
        title: "Unsaved changes",
        kind: "warning",
        buttons: "OkCancel",
      },
    );
    return result === "Ok";
  }, []);

  const openFileInTab = useCallback(async (fullPath: string) => {
    const existing = tabsRef.current.find((t) => t.filePath === fullPath);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }

    try {
      const content = await readTextFile(fullPath);
      const id = crypto.randomUUID();
      const next: EditorTab = {
        id,
        filePath: fullPath,
        content,
        baseline: content,
      };
      startTransition(() => {
        setTabs((prev) => {
          const dup = prev.find((t) => t.filePath === fullPath);
          if (dup) {
            queueMicrotask(() => setActiveTabId(dup.id));
            return prev;
          }
          queueMicrotask(() => setActiveTabId(id));
          return [...prev, next];
        });
      });
    } catch (err) {
      console.error("Error opening file:", err);
      await message(`Could not open the file.\n\n${String(err)}`, {
        title: "Open failed",
        kind: "error",
      });
    }
  }, []);

  const handleNewTab = useCallback(() => {
    const t = newEmptyTab();
    setTabs((prev) => [...prev, t]);
    setActiveTabId(t.id);
  }, []);

  const handleOpenFile = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Text",
            extensions: fileExtensionFilters,
          },
        ],
      });

      if (!selected || typeof selected !== "string") return;

      await openFileInTab(selected);
    } catch (err) {
      console.error("Error reading text file:", err);
      await message(`Could not open the file.\n\n${String(err)}`, {
        title: "Open failed",
        kind: "error",
      });
    }
  }, [openFileInTab]);

  const handleOpenFolder = useCallback(async () => {
    if (!(await confirmDiscardAllTabs(tabs))) return;
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected === null || Array.isArray(selected)) return;
      setWorkspaceRoot(selected);
      const t = newEmptyTab();
      setTabs([t]);
      setActiveTabId(t.id);
    } catch (err) {
      console.error("Error opening folder:", err);
      await message(`Could not open the folder.\n\n${String(err)}`, {
        title: "Open folder failed",
        kind: "error",
      });
    }
  }, [confirmDiscardAllTabs, tabs]);

  const handleCloseFolder = useCallback(async () => {
    if (!(await confirmDiscardAllTabs(tabs))) return;
    setWorkspaceRoot(null);
    const t = newEmptyTab();
    setTabs([t]);
    setActiveTabId(t.id);
  }, [confirmDiscardAllTabs, tabs]);

  const closeTab = useCallback(
    async (id: string) => {
      const tab = tabs.find((t) => t.id === id);
      if (!tab) return;
      if (tab.content !== tab.baseline) {
        const result = await message(
          "You have unsaved changes. Discard them?",
          {
            title: "Unsaved changes",
            kind: "warning",
            buttons: "OkCancel",
          },
        );
        if (result !== "Ok") return;
      }

      const idx = tabs.findIndex((t) => t.id === id);
      const nextTabs = tabs.filter((t) => t.id !== id);
      if (nextTabs.length === 0) {
        const t = newEmptyTab();
        setTabs([t]);
        setActiveTabId(t.id);
        return;
      }
      setTabs(nextTabs);
      if (activeTabId === id) {
        const ni = Math.max(0, idx - 1);
        setActiveTabId(nextTabs[ni]!.id);
      }
    },
    [tabs, activeTabId],
  );

  const handleWrite = useCallback(async () => {
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return;

    try {
      let targetPath = tab.filePath;

      if (!targetPath) {
        const selected = await save({
          filters: [{ name: "Text", extensions: fileExtensionFilters }],
        });

        if (!selected || typeof selected !== "string") return;

        targetPath = selected;
      }

      await writeTextFile(targetPath, tab.content);

      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                filePath: targetPath,
                baseline: t.content,
              }
            : t,
        ),
      );
    } catch (err) {
      console.error("Error writing text file:", err);
      await message(`Could not save the file.\n\n${String(err)}`, {
        title: "Save failed",
        kind: "error",
      });
    }
  }, [tabs, activeTabId]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        void handleWrite();
      } else if (key === "o") {
        e.preventDefault();
        if (e.shiftKey) void handleOpenFolder();
        else void handleOpenFile();
      } else if (key === "n") {
        e.preventDefault();
        void handleNewTab();
      } else if (key === "w") {
        e.preventDefault();
        void closeTab(activeTabId);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    handleWrite,
    handleOpenFile,
    handleOpenFolder,
    handleNewTab,
    closeTab,
    activeTabId,
  ]);

  const langLabel = ACE_MODE_LABELS[activeMode] ?? activeMode;
  const folderTitle = workspaceRoot ? fileBasename(workspaceRoot) : null;
  const productLabel = "minicoder";

  return (
    <div className="editor-container h-full min-h-0">
      <Workbench
        activityBar={
          <>
            <button
              type="button"
              title="Explorer"
              onClick={() => setActivity("files")}
              className={`flex h-12 w-12 items-center justify-center border-l-2 transition-colors ${
                activity === "files"
                  ? "border-[#0078d4] text-[var(--vscode-activityBar-foreground)]"
                  : "border-transparent text-[var(--vscode-activityBar-inactiveForeground)] hover:text-[var(--vscode-activityBar-foreground)]"
              }`}
            >
              <IconFiles className="h-6 w-6" />
            </button>
            <button
              type="button"
              title="Search"
              onClick={() => setActivity("search")}
              className={`flex h-12 w-12 items-center justify-center border-l-2 transition-colors ${
                activity === "search"
                  ? "border-[#0078d4] text-[var(--vscode-activityBar-foreground)]"
                  : "border-transparent text-[var(--vscode-activityBar-inactiveForeground)] hover:text-[var(--vscode-activityBar-foreground)]"
              }`}
            >
              <IconSearch className="h-6 w-6" />
            </button>
          </>
        }
        sidebar={
          activity === "search" ? (
            workspaceRoot ? (
              <WorkspaceSearch
                workspaceRoot={workspaceRoot}
                onOpenFile={(p) => void openFileInTab(p)}
              />
            ) : (
              <div className="flex flex-col gap-2 p-4 text-[13px] text-[#969696]">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#bbbbbb]">
                  Search
                </span>
                <p>Open a folder from the Explorer first, then you can search files by name here.</p>
              </div>
            )
          ) : (
            <div className="flex h-full min-h-0 flex-col text-[13px]">
              {workspaceRoot ? (
                <div className="flex min-h-0 flex-1 flex-col px-0 pb-2 pt-2">
                  <div className="flex shrink-0 items-center justify-between px-4 pb-1 pr-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#bbbbbb]">
                      {folderTitle}
                    </span>
                    <button
                      type="button"
                      title="Close folder"
                      className="rounded px-1.5 py-0.5 text-[11px] text-[#858585] hover:bg-[var(--vscode-list-hoverBackground)] hover:text-[#cccccc]"
                      onClick={() => void handleCloseFolder()}
                    >
                      ✕
                    </button>
                  </div>
                  <FileTree
                    key={workspaceRoot}
                    rootPath={workspaceRoot}
                    activeFilePath={activeTab.filePath}
                    onFileOpen={(p) => void openFileInTab(p)}
                  />
                </div>
              ) : null}

              <div className="mx-2 my-2 h-px shrink-0 bg-[#2b2b2b]" />

              <div className="shrink-0 px-4 pb-2 text-[11px] font-bold uppercase tracking-wide text-[#bbbbbb]">
                Minicoder
              </div>
              <nav className="flex shrink-0 flex-col px-2 pb-2">
                <ExplorerAction
                  label="New File"
                  shortcut={shortcutLabel("N")}
                  onClick={() => handleNewTab()}
                />
                <ExplorerAction
                  label="Open File…"
                  shortcut={shortcutLabel("O")}
                  onClick={() => void handleOpenFile()}
                />
                <ExplorerAction
                  label="Open Folder…"
                  shortcut={shortcutOpenFolder()}
                  onClick={() => void handleOpenFolder()}
                />
                <ExplorerAction
                  label="Save"
                  shortcut={shortcutLabel("S")}
                  onClick={() => void handleWrite()}
                />
              </nav>
            </div>
          )
        }
        editorTabs={
          <div className="flex min-h-0 min-w-0 flex-1 items-end gap-px overflow-x-auto bg-[var(--vscode-editorGroupHeader-tabsBackground)] px-1 pt-1">
            {tabs.map((tab) => {
              const dirty = tab.content !== tab.baseline;
              const tabTitle = fileBasename(tab.filePath);
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  className={`group flex h-8 min-w-0 max-w-[200px] shrink-0 cursor-default items-center gap-1 border border-[var(--vscode-tab-border)] border-b-0 px-2 text-[13px] ${
                    isActive
                      ? "border-b-0 bg-[var(--vscode-tab-activeBackground)] text-[var(--vscode-tab-activeForeground)]"
                      : "bg-[var(--vscode-tab-inactiveBackground)] text-[var(--vscode-tab-inactiveForeground)]"
                  }`}
                  style={
                    isActive
                      ? { borderTop: "2px solid var(--vscode-tab-activeBorderTop)" }
                      : undefined
                  }
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-1 text-left"
                    onClick={() => setActiveTabId(tab.id)}
                  >
                    <IconFile className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span className="min-w-0 flex-1 truncate">{tabTitle}</span>
                    {dirty ? (
                      <span className="shrink-0 rounded-full bg-[#0078d4]/40 px-1 text-[9px] font-medium leading-none text-[#cde7ff]">
                        M
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    title="Close tab"
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-70 hover:bg-[#37373d] hover:opacity-100"
                    onClick={() => void closeTab(tab.id)}
                  >
                    <span className="text-[14px] leading-none text-[#cccccc]">
                      ×
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        }
        editor={
          <CodeEditor
            code={activeTab.content}
            filePath={activeTab.filePath}
            onEditorMetrics={onEditorMetrics}
            onActiveMode={onActiveMode}
            setCode={setActiveContent}
          />
        }
        statusBar={
          <>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="truncate">
                Ln {metrics.line}, Col {metrics.column}
              </span>
              <span className="hidden opacity-90 sm:inline">Spaces: 2</span>
              <span className="hidden opacity-90 md:inline">UTF-8</span>
              <span className="hidden opacity-90 lg:inline">LF</span>
            </div>
            <div className="flex shrink-0 items-center gap-4 pl-2">
              <span className="truncate">{productLabel}</span>
              <span className="truncate">{langLabel}</span>
              <span className="opacity-90">{metrics.totalLines} lines</span>
            </div>
          </>
        }
      />
    </div>
  );
}

function ExplorerAction(props: {
  label: string;
  shortcut: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-[13px] text-[#cccccc] hover:bg-[var(--vscode-list-hoverBackground)] active:bg-[var(--vscode-list-activeSelectionBackground)]"
    >
      <span>{props.label}</span>
      <span className="shrink-0 text-[11px] text-[#858585]">{props.shortcut}</span>
    </button>
  );
}
