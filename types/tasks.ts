import { z } from "zod";

export interface AiStatusPayload {
  text?: string;
  phase?: "start" | "processing" | "complete" | "error";
}

export function validateAiStatusPayload(data: unknown): AiStatusPayload | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const result: AiStatusPayload = {};

  if (d.text !== undefined) {
    if (typeof d.text !== "string") return null;
    result.text = d.text;
  }

  if (d.phase !== undefined) {
    const valid = ["start", "processing", "complete", "error"];
    if (!valid.includes(d.phase as string)) return null;
    result.phase = d.phase as AiStatusPayload["phase"];
  }

  return result;
}

export const AiChatMessageSchema = z.object({
  id: z.string(),
  sender: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  timestamp: z.number(),
});

export type AiChatMessage = z.infer<typeof AiChatMessageSchema>;

export function validateAiChatMessage(data: unknown): AiChatMessage | null {
  const result = AiChatMessageSchema.safeParse(data);
  return result.success ? result.data : null;
}
