"use client";

import { Minus, Plus, Maximize, Undo2, Redo2 } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { useUndo, useRedo, useCanUndo, useCanRedo } from "@liveblocks/react/suspense";
import { cn } from "@/lib/utils";

export function CanvasControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  return (
    <div className="absolute bottom-5 left-5 z-10 flex items-center gap-1 rounded-full border border-border-default bg-bg-surface/95 p-1 shadow-2xl shadow-bg-base/60 backdrop-blur">
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition hover:bg-bg-subtle hover:text-text-primary"
          onClick={() => zoomOut({ duration: 300 })}
          title="Zoom Out (-)"
          aria-label="Zoom Out"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition hover:bg-bg-subtle hover:text-text-primary"
          onClick={() => fitView({ duration: 300 })}
          title="Fit View"
          aria-label="Fit View"
        >
          <Maximize className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition hover:bg-bg-subtle hover:text-text-primary"
          onClick={() => zoomIn({ duration: 300 })}
          title="Zoom In (+)"
          aria-label="Zoom In"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-1 h-4 w-px bg-border-default" />

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={!canUndo}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full transition",
            canUndo 
              ? "text-text-muted hover:bg-bg-subtle hover:text-text-primary" 
              : "text-text-faint opacity-50 cursor-not-allowed"
          )}
          onClick={() => undo()}
          title="Undo (Cmd+Z)"
          aria-label="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={!canRedo}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full transition",
            canRedo 
              ? "text-text-muted hover:bg-bg-subtle hover:text-text-primary" 
              : "text-text-faint opacity-50 cursor-not-allowed"
          )}
          onClick={() => redo()}
          title="Redo (Cmd+Shift+Z)"
          aria-label="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
