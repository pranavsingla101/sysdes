import { schemaTask, logger, metadata } from "@trigger.dev/sdk";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { put } from "@vercel/blob";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

const AiChatMessageSchema = z.object({
  id: z.string(),
  sender: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  timestamp: z.number(),
});

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

const GenerateSpecSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(AiChatMessageSchema).default([]),
  nodes: z.array(CanvasNodeSchema).default([]),
  edges: z.array(CanvasEdgeSchema).default([]),
});

function buildPrompt(payload: z.infer<typeof GenerateSpecSchema>): string {
  const { chatHistory, nodes, edges } = payload;

  const nodeLines = nodes
    .map((n) => {
      const label = n.data?.label ?? n.id;
      const shape = n.data?.shape ?? "rectangle";
      return `- ${label} (${shape}, id: ${n.id})`;
    })
    .join("\n");

  const edgeLines = edges
    .map((e) => {
      const label = e.data?.label ? ` [${e.data.label}]` : "";
      return `- ${e.source} → ${e.target}${label}`;
    })
    .join("\n");

  const chatLines = chatHistory
    .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
    .join("\n");

  return `You are a senior software architect. Generate a detailed Markdown technical specification based on the system design canvas and conversation below.

## Canvas Nodes (${nodes.length})
${nodeLines || "No nodes."}

## Canvas Edges (${edges.length})
${edgeLines || "No edges."}

## Design Conversation
${chatLines || "No conversation history."}

---

Write a comprehensive technical specification in Markdown. Include:
1. **Overview** — What system is being designed and its purpose.
2. **Architecture Summary** — High-level description of the components.
3. **Components** — One section per major node: responsibilities, interfaces, tech choices.
4. **Data Flow** — How data moves between components, describing each edge connection.
5. **Non-Functional Requirements** — Scalability, reliability, security considerations derived from the design.
6. **Open Questions** — Unresolved design decisions evident from the canvas.

Be specific, technical, and actionable. Use the node labels and connection labels directly. Do not add placeholder text.`;
}

export const generateSpec = schemaTask({
  id: "generate-spec",
  schema: GenerateSpecSchema,
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30_000,
    randomize: true,
  },
  run: async (payload) => {
    const { projectId, roomId } = payload;

    logger.info("generate-spec started", {
      projectId,
      roomId,
      nodes: payload.nodes.length,
      edges: payload.edges.length,
      chatMessages: payload.chatHistory.length,
    });

    metadata.set("status", "starting").set("progress", 0);

    let specContent: string;

    try {
      metadata.set("status", "generating").set("progress", 20);

      const prompt = buildPrompt(payload);

      const { text } = await generateText({
        model: google("gemini-2.5-flash"),
        prompt,
      });

      specContent = text.trim();

      metadata.set("status", "saving").set("progress", 80);

      const blob = await put(
        `specs/${projectId}/${Date.now()}.md`,
        specContent,
        { access: "private", contentType: "text/markdown", allowOverwrite: false }
      );

      const specRecord = await prisma.projectSpec.create({
        data: {
          projectId,
          filePath: blob.url,
        },
      });

      metadata.set("status", "complete").set("progress", 100);

      logger.info("generate-spec complete", {
        projectId,
        roomId,
        specId: specRecord.id,
        specLength: specContent.length,
      });

      return { spec: specContent, specId: specRecord.id };
    } catch (err) {
      logger.error("Spec generation failed", { projectId, roomId, err });
      metadata.set("status", "error").set("progress", 0);
      throw err;
    }
  },
});
