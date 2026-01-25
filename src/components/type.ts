export type SupportedMode =
  | "html"
  | "css"
  | "javascript"
  | "typescript"
  | "php"
  | "python"
  | "rust"
  | "c++"
  | "c"
  | "markdown";
export interface CodeEditorPropTypes {
  code: string;
  setCode: (value: string) => void;
}

export type FileExtensionFilters = Array<
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
