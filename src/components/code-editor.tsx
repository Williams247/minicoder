import { memo, useEffect, useMemo, useRef, useState } from "react";
import AceEditor from "react-ace";
import type { Ace } from "ace-builds";
import hljs from "highlight.js";
import { invoke } from "@tauri-apps/api/core";

import "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-jsx";
import "ace-builds/src-noconflict/mode-markdown";
import "ace-builds/src-noconflict/mode-php";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-rust";
import "ace-builds/src-noconflict/mode-text";
import "ace-builds/src-noconflict/mode-tsx";
import "ace-builds/src-noconflict/mode-typescript";
import "ace-builds/src-noconflict/theme-one_dark";
import "ace-builds/src-noconflict/ext-language_tools";

import { type SupportedMode, type CodeEditorPropTypes } from "./type";

const HLJS_TO_ACE: Record<string, SupportedMode> = {
  javascript: "javascript",
  js: "javascript",
  typescript: "typescript",
  ts: "typescript",
  jsx: "jsx",
  tsx: "tsx",
  php: "php",
  python: "python",
  py: "python",
  rust: "rust",
  rs: "rust",
  html: "html",
  xml: "html",
  css: "css",
  markdown: "markdown",
  md: "markdown",
  c: "c_cpp",
  cpp: "c_cpp",
  arduino: "c_cpp",
};

/** Max chars to run highlight.js auto-detect (avoids freezing on huge pastes). */
const HIGHLIGHT_AUTO_MAX = 48_000;

function extensionFromPath(path: string): string {
  const base = path.replace(/^.*[/\\]/, "");
  if (!base || base === "." || base === "..") return "";
  const dot = base.lastIndexOf(".");
  if (dot <= 0) {
    if (base.startsWith(".") && base.length > 1) {
      const tail = base.slice(1);
      if (!tail.includes(".")) return tail.toLowerCase();
    }
    return "";
  }
  return base.slice(dot + 1).toLowerCase();
}

function modeFromFilePath(path: string | null): SupportedMode | null {
  if (!path) return null;
  const ext = extensionFromPath(path);
  switch (ext) {
    case "ts":
      return "typescript";
    case "tsx":
      return "tsx";
    case "jsx":
      return "jsx";
    case "js":
    case "mjs":
    case "cjs":
      return "javascript";
    case "css":
      return "css";
    case "html":
    case "htm":
      return "html";
    case "md":
    case "mdx":
      return "markdown";
    case "py":
      return "python";
    case "php":
      return "php";
    case "rs":
      return "rust";
    case "c":
    case "h":
      return "c_cpp";
    case "cpp":
    case "cc":
    case "cxx":
    case "hpp":
      return "c_cpp";
    case "txt":
    case "gitignore":
      return "text";
    case "env":
      return "text";
    default:
      return null;
  }
}

function CodeEditorInner(props: CodeEditorPropTypes) {
  const [editor, setEditor] = useState<Ace.Editor | null>(null);
  const metricsCb = props.onEditorMetrics;
  const modeCb = props.onActiveMode;

  const mode = useMemo<SupportedMode>(() => {
    const fromPath = modeFromFilePath(props.filePath);
    if (fromPath) return fromPath;

    const code = props.code;
    if (code.trim() === "") return "javascript";
    if (code.length > HIGHLIGHT_AUTO_MAX) return "text";
    const detected = hljs.highlightAuto(code);
    const lang = detected.language ?? undefined;
    return lang && HLJS_TO_ACE[lang] ? HLJS_TO_ACE[lang] : "javascript";
  }, [props.filePath, props.code]);

  useEffect(() => {
    modeCb?.(mode);
  }, [mode, modeCb]);

  const phpLintGeneration = useRef(0);

  useEffect(() => {
    if (!editor) return;

    if (mode !== "php") {
      editor.getSession().setAnnotations([]);
      return;
    }

    const generation = ++phpLintGeneration.current;
    const source = props.code;
    const debounceMs = 400;
    const handle = window.setTimeout(() => {
      void invoke<Array<{ row: number; column?: number; text: string }>>(
        "lint_php",
        { source },
      )
        .then((diagnostics) => {
          if (generation !== phpLintGeneration.current) return;
          const annotations: Ace.Annotation[] = diagnostics.map((d) => ({
            row: d.row,
            column: d.column ?? 0,
            text: d.text,
            type: "error" as const,
          }));
          editor.getSession().setAnnotations(annotations);
        })
        .catch(() => {
          if (generation !== phpLintGeneration.current) return;
          editor.getSession().setAnnotations([]);
        });
    }, debounceMs);

    return () => {
      window.clearTimeout(handle);
      phpLintGeneration.current += 1;
    };
  }, [editor, mode, props.code]);

  useEffect(() => {
    if (!editor || !metricsCb) return;
    const ed = editor;
    const cb = metricsCb;

    function report() {
      const pos = ed.getCursorPosition();
      cb({
        line: pos.row + 1,
        column: pos.column + 1,
        totalLines: ed.session.getLength(),
      });
    }

    ed.session.selection.on("changeCursor", report);
    ed.session.on("change", report);
    report();

    return () => {
      ed.session.selection.off("changeCursor", report);
      ed.session.off("change", report);
    };
  }, [editor, metricsCb, props.code]);

  return (
    <AceEditor
      theme="one_dark"
      mode={mode}
      name="ace-editor"
      fontSize={14}
      width="100%"
      height="100%"
      value={props.code}
      showPrintMargin={false}
      tabSize={2}
      highlightActiveLine
      showGutter
      setOptions={{
        useWorker: false,
        scrollPastEnd: true,
        fontFamily:
          "'Cascadia Code', 'Cascadia Mono', 'SF Mono', Consolas, 'Courier New', monospace",
        cursorStyle: "smooth",
        behavioursEnabled: true,
      }}
      onChange={(value) => props.setCode(value)}
      onLoad={(ed) => {
        setEditor(ed);
      }}
    />
  );
}

/** Avoid re-rendering the whole Ace surface when only the status bar updates (cursor metrics). */
export const CodeEditor = memo(
  CodeEditorInner,
  (prev, next) =>
    prev.code === next.code &&
    prev.filePath === next.filePath &&
    prev.setCode === next.setCode &&
    prev.onEditorMetrics === next.onEditorMetrics &&
    prev.onActiveMode === next.onActiveMode,
);
