"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useOthers } from "@liveblocks/react/suspense";
import { UserButton, useUser } from "@clerk/nextjs";

const MAX_SHOWN = 20;

export function PresenceAvatars() {
  const others = useOthers();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSlot(document.getElementById("navbar-presence-slot"));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target;
      if (
        target instanceof Element &&
        target.closest('[class*="cl-userButtonPopover"]')
      ) {
        return;
      }

      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  const collaborators = others
    .filter((other) => other.id !== user?.id)
    .slice(0, MAX_SHOWN);

  if (!slot) return null;

  const displayName =
    user?.fullName ?? user?.emailAddresses?.[0]?.emailAddress ?? "You";

  const content = (
    <div ref={wrapperRef} className="relative">
      {/* Trigger — your avatar only */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center justify-center rounded-full"
        title="Show collaborators"
      >
        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={displayName}
            className="h-7 w-7 rounded-full object-cover ring-2 ring-border-default"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-elevated text-[11px] font-bold text-text-secondary ring-2 ring-border-default">
            {displayName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
        )}
        {collaborators.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-primary text-[9px] font-bold leading-none text-bg-base">
            {collaborators.length > 9 ? "9+" : collaborators.length}
          </span>
        )}
      </button>

      {/* Dropdown — overflows onto canvas */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-border-default bg-bg-surface/95 shadow-2xl shadow-bg-base/60 backdrop-blur">
          <div className="border-b border-border-subtle px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-faint">
              On this canvas
            </p>
          </div>

          <ul className="py-1">
            {/* Current user */}
            <li className="flex items-center gap-2.5 px-3 py-2">
              <div className="h-7 w-7 shrink-0">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "h-7 w-7",
                      userButtonTrigger: "h-7 w-7",
                    },
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">
                  {displayName}
                </p>
                <p className="text-[10px] text-text-faint">You</p>
              </div>
              <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
            </li>

            {/* Collaborators */}
            {collaborators.map((other) => (
              <li
                key={other.connectionId}
                className="flex items-center gap-2.5 px-3 py-2"
              >
                <div
                  className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border-2 border-bg-surface"
                  style={{ boxShadow: `0 0 0 1.5px ${other.info.cursorColor}` }}
                >
                  {other.info.avatarUrl ? (
                    <img
                      src={other.info.avatarUrl}
                      alt={other.info.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center text-[10px] font-bold"
                      style={{
                        backgroundColor: other.info.cursorColor + "30",
                        color: other.info.cursorColor,
                      }}
                    >
                      {other.info.displayName
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {other.info.displayName}
                  </p>
                </div>
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: other.info.cursorColor }}
                />
              </li>
            ))}

            {collaborators.length === 0 && (
              <li className="px-3 py-2.5 text-xs text-text-faint">
                No other collaborators online
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );

  return createPortal(content, slot);
}
