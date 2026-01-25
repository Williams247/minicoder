export type SupportedMode = "javascript" | "python" | "html" | "css" | "php";

export interface CodeEditorPropTypes {
  code: string;
  setCode: (value: string) => void;
}
