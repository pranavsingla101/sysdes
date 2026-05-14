import type { LiveList } from "@liveblocks/client";
import type { AiChatMessage } from "@/types/tasks";

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    Storage: {
      aiChat: LiveList<AiChatMessage>;
    };

    UserMeta: {
      id: string;
      info: {
        displayName: string;
        avatarUrl: string;
        cursorColor: string;
      };
    };

    RoomEvent:
      | { type: "AI_THINKING"; isThinking: boolean }
      | { type: "AI_STATUS"; message: string; phase: "start" | "processing" | "complete" | "error" }
      | {
          type: "AI_CANVAS_OPS";
          operations: Array<
            | { action: "add_node"; node: { id: string; label: string; shape: string; colorFill: string; x: number; y: number; width: number; height: number } }
            | { action: "move_node"; nodeId: string; x: number; y: number }
            | { action: "resize_node"; nodeId: string; width: number; height: number }
            | { action: "update_node_data"; nodeId: string; label?: string; colorFill?: string; shape?: string }
            | { action: "delete_node"; nodeId: string }
            | { action: "add_edge"; edge: { id: string; source: string; target: string; label?: string } }
            | { action: "delete_edge"; edgeId: string }
          >;
        };

    ThreadMetadata: Record<string, never>;
    RoomInfo: Record<string, never>;
  }
}

export {};
