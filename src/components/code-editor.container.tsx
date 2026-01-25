import { readTextFile } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog"; // Highly recommended for editors
import { useState } from "react";
import { CodeEditor } from "./code-editor";

export function CodeEditorContainer() {
  const [fileContent, setFileContent] = useState<string>("// Select a file to begin...");

  async function handleOpen() {
    try {
      // 1. Open a native dialog to pick a text file
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Text',
          extensions: ['txt', 'md', 'js', 'ts', 'json']
        }]
      });

      if (selected) {
        // 2. Read the file directly as text
        const content = await readTextFile(selected);
        setFileContent(content);
      }
    } catch (err) {
      console.error("Error reading text file:", err);
    }
  }

  return (
    <div className="editor-container">
      <button onClick={handleOpen}>Open Text File</button>
      <CodeEditor code={fileContent} setCode={() => {}} />
    </div>
  );
}