import { useState, useRef, useEffect, type ReactNode } from "react";

interface WorkbenchProps {
  /** Narrow activity bar (icons). */
  activityBar: ReactNode;
  /** Explorer / side panel content. */
  sidebar: ReactNode;
  /** Tab strip above the editor. */
  editorTabs: ReactNode;
  /** Editor surface. */
  editor: ReactNode;
  /** Bottom status bar. */
  statusBar: ReactNode;
}

export function Workbench(props: WorkbenchProps) {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const dragging = useRef(false);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging.current) return;
      const next = e.clientX - 48; /* subtract activity bar */
      if (next >= 160 && next <= 480) setSidebarWidth(next);
    }

    function onUp() {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  function startDrag() {
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  return (
    <div className="vscode-workbench flex h-full w-full min-h-0 flex-col overflow-hidden bg-[var(--vscode-sideBar-background)] text-[var(--vscode-sideBar-foreground)]">
      <header
        data-tauri-drag-region
        className="flex h-8 shrink-0 select-none items-center border-b border-[#2b2b2b] bg-[var(--vscode-titleBar-activeBackground)] pl-3 text-[13px] text-[var(--vscode-titleBar-activeForeground)]"
      >
        <span className="opacity-90">minicoder</span>
      </header>
      <div className="flex min-h-0 min-w-0 flex-1">
        {/* Activity bar */}
        <aside
          className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-[var(--vscode-activityBar-border)] bg-[var(--vscode-activityBar-background)] py-2"
          aria-label="Activity bar"
        >
          {props.activityBar}
        </aside>

        {/* Side bar */}
        <div
          className="flex shrink-0 flex-col overflow-hidden border-r border-[var(--vscode-sideBar-border)] bg-[var(--vscode-sideBar-background)]"
          style={{ width: sidebarWidth }}
        >
          {props.sidebar}
        </div>

        {/* Splitter */}
        <div
          role="separator"
          aria-orientation="vertical"
          onMouseDown={startDrag}
          className="vscode-sash group relative w-[5px] shrink-0 cursor-col-resize"
        >
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--vscode-sash-hoverBorder)] opacity-60 transition group-hover:opacity-100" />
        </div>

        {/* Editor column */}
        <div className="editor-main flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--vscode-editor-background)]">
          <div className="flex h-9 shrink-0 items-stretch bg-[var(--vscode-editorGroupHeader-tabsBackground)]">
            {props.editorTabs}
          </div>
          <div className="relative min-h-0 min-w-0 flex-1">{props.editor}</div>
        </div>
      </div>

      {/* Status bar */}
      <footer className="vscode-statusbar flex h-[22px] shrink-0 items-center justify-between border-t border-[var(--vscode-statusBar-border)] bg-[var(--vscode-statusBar-background)] px-3 text-[12px] text-[var(--vscode-statusBar-foreground)]">
        {props.statusBar}
      </footer>
    </div>
  );
}
