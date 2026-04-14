/** Ace editor mode names (see ace-builds `mode-*` files). */
export type SupportedMode =
  | "text"
  | "html"
  | "css"
  | "javascript"
  | "typescript"
  | "tsx"
  | "jsx"
  | "php"
  | "python"
  | "rust"
  | "c_cpp"
  | "markdown";

export interface EditorMetrics {
  line: number;
  column: number;
  totalLines: number;
}

/** One editor tab (multi-document). */
export interface EditorTab {
  id: string;
  filePath: string | null;
  content: string;
  /** Content last saved or loaded from disk — used for dirty detection. */
  baseline: string;
}

export interface CodeEditorPropTypes {
  code: string;
  setCode: (value: string) => void;
  /** When set, syntax mode is derived from the path (falls back to auto-detect). */
  filePath: string | null;
  /** Cursor / document stats for the status bar. */
  onEditorMetrics?: (metrics: EditorMetrics) => void;
  /** Resolved Ace mode for the status bar. */
  onActiveMode?: (mode: SupportedMode) => void;
}

export type FileExtensionFilters = Array<
  | "txt"
  | "html"
  | "css"
  | "js"
  | "ts"
  | "jsx"
  | "tsx"
  | "php"
  | "py"
  | "rs"
  | "cpp"
  | "c"
  | "md"
>;
