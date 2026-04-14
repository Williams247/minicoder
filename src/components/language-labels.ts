import type { SupportedMode } from "./type";

/** Human-readable labels for the status bar (VS Code–style). */
export const ACE_MODE_LABELS: Record<SupportedMode, string> = {
  text: "Plain Text",
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
  typescript: "TypeScript",
  tsx: "TypeScript React",
  jsx: "JavaScript React",
  php: "PHP",
  python: "Python",
  rust: "Rust",
  c_cpp: "C/C++",
  markdown: "Markdown",
};
