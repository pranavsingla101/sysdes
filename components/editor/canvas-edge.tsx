"use client";

import { useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { CanvasEdge } from "@/types/canvas";

export function CanvasEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  interactionWidth = 20,
}: EdgeProps<CanvasEdge>) {
  const { updateEdgeData } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const onDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsEditing(true);
  };

  const handleLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateEdgeData(id, { label: event.target.value });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === "Escape") {
      setIsEditing(false);
    }
  };

  const isActive = selected || isHovered;

  return (
    <>
      {/* Invisible interaction path for easier clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={interactionWidth}
        className="react-flow__edge-interaction"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={onDoubleClick}
      />
      
      {/* Visible edge path */}
      <BaseEdge
        path={edgePath}
        markerEnd="url(#sysdes-arrowhead)"
        style={{
          stroke: isActive ? "var(--text-primary)" : "var(--border-subtle)",
          strokeWidth: 2,
          opacity: isActive ? 1 : 0.6,
          transition: "stroke 0.2s, opacity 0.2s",
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
          onDoubleClick={onDoubleClick}
        >
          {isEditing ? (
            <input
              autoFocus
              className="min-w-[40px] rounded-full border border-accent-primary bg-bg-surface px-3 py-1 text-center text-xs text-text-primary outline-none shadow-lg"
              value={data?.label || ""}
              onChange={handleLabelChange}
              onBlur={() => setIsEditing(false)}
              onKeyDown={handleKeyDown}
              style={{
                width: `${Math.max(40, (data?.label?.length || 0) * 8 + 24)}px`,
              }}
              placeholder="Label"
            />
          ) : data?.label ? (
            <div className="rounded-full border border-border-subtle bg-bg-surface/90 px-2.5 py-0.5 text-[10px] font-medium text-text-secondary shadow-sm backdrop-blur transition-colors hover:border-border-default hover:text-text-primary">
              {data.label}
            </div>
          ) : isActive ? (
            <div className="rounded-full border border-dashed border-border-subtle bg-bg-surface/40 px-2 py-0.5 text-[10px] text-text-faint transition-opacity">
              Add label
            </div>
          ) : null}

        </div>
      </EdgeLabelRenderer>
    </>
  );
}
