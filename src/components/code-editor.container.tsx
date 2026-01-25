import { readTextFile } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog"; // Highly recommended for editors
import { useState } from "react";
import { CodeEditor } from "./code-editor";
import { fileExtensionFilters } from "./constant";

export function CodeEditorContainer() {
  const [fileContent, setFileContent] = useState<string>(
    "// Select a file to begin...",
  );

  // Open a file
  async function handleOpen() {
    try {
      const selected = await open({
        multiple: false, // Restricts the selection of multiple files
        filters: [
          {
            name: "Text", // File format
            extensions: fileExtensionFilters, // File extensions that are allowed to be opened
          },
        ],
      });

      if (selected) {
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
      <CodeEditor
        code={fileContent}
        setCode={(code) => {
          setFileContent(code);
        }}
      />
    </div>
  );
}
