import { useMemo } from "react";
import AceEditor from "react-ace";
import hljs from "highlight.js";

import "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-php";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import { type SupportedMode, type CodeEditorPropTypes } from "./type";

const langMap: Record<string, SupportedMode> = {
  javascript: "javascript",
  js: "javascript",
  php: "php",
  python: "python",
  py: "python",
  html: "html",
  css: "css",
};

export function CodeEditor(props: CodeEditorPropTypes) {

  const mode = useMemo<SupportedMode>(() => {
    if (props.code.trim() === "") return "javascript";
    const detected = hljs.highlightAuto(props.code);
    return detected.language && langMap[detected.language]
      ? langMap[detected.language]
      : "javascript";
  }, [props.code]);

  return (
    <AceEditor
      theme="monokai"
      mode={mode}
      fontSize={14}
      value={props.code}
      showPrintMargin={false}
      onChange={(value) => props.setCode(value)}
    />
  );
}
