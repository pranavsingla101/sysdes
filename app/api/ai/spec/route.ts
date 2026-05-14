import { tasks } from "@trigger.dev/sdk";
import type { generateSpec } from "@/trigger/generate-spec";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/project-api";
import {
  getCurrentProjectIdentity,
  getProjectByAccess,
} from "@/lib/project-access";
import { z } from "zod";
import type { AiChatMessage } from "@/types/tasks";

const CanvasNodeSchema = z.object({
  id: z.string(),
  data: z.object({
    label: z.string().optional(),
    shape: z.string().optional(),
  }).passthrough().optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
}).passthrough();

const CanvasEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  data: z.object({ label: z.string().optional() }).passthrough().optional(),
}).passthrough();

const AiChatMessageSchema = z.object({
  id: z.string(),
  sender: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  timestamp: z.number(),
});

const SpecRequestSchema = z.object({
  roomId: z.string().min(1),
  chatHistory: z.array(AiChatMessageSchema).default([]),
  nodes: z.array(CanvasNodeSchema).default([]),
  edges: z.array(CanvasEdgeSchema).default([]),
});

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity();

  if (!identity) {
    return errorResponse("Unauthorized", 401);
  }

  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return errorResponse("Request body is required.", 400);
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  const parsed = SpecRequestSchema.safeParse(parsedJson);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? "Invalid request body.", 400);
  }

  const { roomId, chatHistory, nodes, edges } = parsed.data;

  const project = await getProjectByAccess(roomId, identity);

  if (!project) {
    return errorResponse("Forbidden", 403);
  }

  const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
    projectId: project.id,
    roomId,
    chatHistory: chatHistory as AiChatMessage[],
    nodes,
    edges,
  });

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId: project.id,
      userId: identity.userId,
    },
  });

  return Response.json({ runId: handle.id }, { status: 201 });
}
