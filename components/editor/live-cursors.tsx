"use client";

import { useOthers } from "@liveblocks/react/suspense";
import { Loader2 } from "lucide-react";

export function LiveCursors() {
  const others = useOthers();

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {others.map((other) => {
        if (!other.presence?.cursor) return null;

        return (
          <Cursor
            key={other.connectionId}
            x={other.presence.cursor.x}
            y={other.presence.cursor.y}
            color={other.info.cursorColor}
            name={other.info.displayName}
            thinking={other.presence.thinking ?? false}
          />
        );
      })}
    </div>
  );
}

function Cursor({
  x,
  y,
  color,
  name,
  thinking,
}: {
  x: number;
  y: number;
  color: string;
  name: string;
  thinking: boolean;
}) {
  return (
    <div
      className="absolute top-0 left-0 transition-transform duration-75 ease-out"
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color }}
      >
        <path
          d="M0.5 0.5V11L4 7.5L6.5 13.5L8.5 12.5L6 6.5L11 6.5L0.5 0.5Z"
          fill="currentColor"
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      <div
        className="ml-3 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-white shadow-lg whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {name}
        {thinking && (
          <Loader2 className="h-2.5 w-2.5 animate-spin opacity-90" />
        )}
      </div>
    </div>
  );
}
