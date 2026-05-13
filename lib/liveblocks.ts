import "server-only";

import { Liveblocks } from "@liveblocks/node";

const CURSOR_COLORS = [
  "#00c8d4",
  "#6457f9",
  "#34d399",
  "#fbbf24",
  "#ff4d4f",
  "#8b82ff",
  "#0AC7B4",
  "#52A8FF",
] as const;

const globalForLiveblocks = globalThis as typeof globalThis & {
  liveblocksClient?: Liveblocks;
};

export function getLiveblocksClient(): Liveblocks {
  if (!process.env.LIVEBLOCKS_SECRET_KEY) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is required.");
  }

  globalForLiveblocks.liveblocksClient ??= new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY,
  });

  return globalForLiveblocks.liveblocksClient;
}

export function cursorColorForUser(userId: string): string {
  let hash = 0;

  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash * 31 + userId.charCodeAt(index)) >>> 0;
  }

  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}
