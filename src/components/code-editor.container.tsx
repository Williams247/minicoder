import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { open, save, message } from "@tauri-apps/plugin-dialog"; // Highly recommended for editors
import { useState } from "react";
import { CodeEditor } from "./code-editor";
import { fileExtensionFilters } from "./constant";
import { CodeEditorSidebar } from "./code.sidebar";

export function CodeEditorContainer() {
  const [fileContent, setFileContent] = useState<string>("");
  const [filePath, setFilePath] = useState<string | null>(null);

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

      if (selected && typeof selected === "string") {
        const content = await readTextFile(selected); // Read from the text content from the selected file
        setFileContent(content); // Set the file content to react state
        setFilePath(selected); // Set the file path to react state
      }
    } catch (err) {
      console.error("Error reading text file:", err);
    }
  }

  // Write to file
  async function handleWrite() {
    try {
      let targetPath = filePath;

      // If no file yet => Save As
      if (!targetPath) {
        const selected = await save({
          filters: [{ name: "Text", extensions: fileExtensionFilters }],
        });

        // User cancelled
        if (!selected || typeof selected !== "string") return;

        targetPath = selected;
      }

      await writeTextFile(targetPath, fileContent);

      setFilePath(targetPath);

      await message("File saved successfully", {
        title: "Success",
        kind: "info",
      });
    } catch (err) {
      console.error("Error writing text file:", err);
    }
  }

  function handleNewFile() {
    setFileContent("");
    setFilePath(null);
  }

  return (
    <div className="editor-container">
      <CodeEditorSidebar
        Sidebar={
          <div>
            <button onClick={handleNewFile}>New File</button>
            <button onClick={handleOpen}>Open File</button>
            <button onClick={handleWrite}>Save File</button>
          </div>
        }
        MainArea={
          <CodeEditor
            code={fileContent}
            setCode={(code) => {
              setFileContent(code);
            }}
          />
        }
      />
    </div>
  );
}
