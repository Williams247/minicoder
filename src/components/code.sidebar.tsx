// NOTE: Please study the code below to understand how it works before you move to the next agenda

import { useState, useRef, useEffect, type ReactNode } from "react";

interface SidebarProps {
  MainArea: ReactNode;
  Sidebar: ReactNode;
}

export function CodeEditorSidebar(props: SidebarProps) {
  const [width, setWidth] = useState<number>(240);
  const dragging = useRef<boolean>(false);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging.current) return;

      const newWidth = e.clientX;

      if (newWidth >= 150 && newWidth <= 400) {
        setWidth(newWidth);
      }
    }

    function onUp() {
      dragging.current = false;
      document.body.style.cursor = "default";
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  function startDrag() {
    dragging.current = true;
    document.body.style.cursor = "col-resize";
  }

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className="bg-gray-900 text-white" style={{ width }}>
        {props.Sidebar}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={startDrag}
        className="w-1 bg-gray-400 cursor-col-resize hover:bg-blue-500"
      />

      {/* Main Area */}
      <div className="flex-1 flex">{props.MainArea}</div>
    </div>
  );
}
