import { type FileExtensionFilters } from "./type";

/** Skipped when listing / searching a workspace (heavy or irrelevant trees). */
export const WORKSPACE_IGNORE_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  ".svn",
  "dist",
  "target",
  ".next",
  "build",
]);

export const fileExtensionFilters: FileExtensionFilters = [
  "txt",
  "html",
  "css",
  "js",
  "ts",
  "jsx",
  "tsx",
  "php",
  "py",
  "rs",
  "cpp",
  "c",
  "md"
];
