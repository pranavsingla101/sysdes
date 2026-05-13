import { useEffect } from "react";

interface UseKeyboardShortcutsProps {
  undo: () => void;
  redo: () => void;
  zoomIn: (options?: { duration: number }) => void;
  zoomOut: (options?: { duration: number }) => void;
}

export function useKeyboardShortcuts({ undo, redo, zoomIn, zoomOut }: UseKeyboardShortcutsProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Ignore if typing in inputs or textareas
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement instanceof HTMLElement && activeElement.isContentEditable);

      if (isInput) {
        return;
      }

      const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      // Undo: Cmd/Ctrl + Z
      if (cmdOrCtrl && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if (
        (cmdOrCtrl && event.shiftKey && event.key.toLowerCase() === "z") ||
        (cmdOrCtrl && event.key.toLowerCase() === "y")
      ) {
        event.preventDefault();
        redo();
        return;
      }

      // Zoom In: + or =
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomIn({ duration: 300 });
        return;
      }

      // Zoom Out: -
      if (event.key === "-") {
        event.preventDefault();
        zoomOut({ duration: 300 });
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, zoomIn, zoomOut]);
}
