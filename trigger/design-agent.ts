import { task, logger } from "@trigger.dev/sdk";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
import { generateText } from "ai";
import { z } from "zod";
import { Liveblocks } from "@liveblocks/node";
import { NODE_COLORS, NODE_SHAPES } from "@/types/canvas";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

export type DesignAgentPayload = {
  prompt: string;
  roomId: string;
};

const SHAPE_DEFAULT_SIZES: Record<string, { width: number; height: number }> = {
  rectangle: { width: 168, height: 88 },
  diamond: { width: 144, height: 144 },
  circle: { width: 112, height: 112 },
  pill: { width: 168, height: 72 },
  cylinder: { width: 132, height: 104 },
  hexagon: { width: 152, height: 104 },
};

const nodeSchema = z.object({
  id: z.string().describe("Unique node identifier, e.g. 'service-api'"),
  label: z.string().describe("Display label for the node"),
  shape: z.enum(NODE_SHAPES).describe(
    "Node shape: rectangle (default), diamond (decision), circle (event), pill (service), cylinder (database), hexagon (external)"
  ),
  colorIndex: z
    .number()
    .int()
    .min(0)
    .max(7)
    .describe(
      "Color palette index 0-7. 0=neutral, 1=blue, 2=purple, 3=orange, 4=red, 5=pink, 6=green, 7=teal"
    ),
  x: z.number().describe("Horizontal position in canvas units"),
  y: z.number().describe("Vertical position in canvas units"),
  width: z.number().optional().describe("Node width in pixels"),
  height: z.number().optional().describe("Node height in pixels"),
});

const edgeSchema = z.object({
  id: z.string().describe("Unique edge identifier"),
  source: z.string().describe("Source node id"),
  target: z.string().describe("Target node id"),
  label: z.string().optional().describe("Optional edge label"),
});

const designSchema = z.object({
  nodes: z.array(nodeSchema).min(1).max(20),
  edges: z.array(edgeSchema).max(30),
});

type CanvasOp =
  | { action: "add_node"; node: { id: string; label: string; shape: string; colorFill: string; x: number; y: number; width: number; height: number } }
  | { action: "add_edge"; edge: { id: string; source: string; target: string; label?: string } };

type AiRoomEvent =
  | { type: "AI_THINKING"; isThinking: boolean }
  | { type: "AI_STATUS"; message: string; phase: "start" | "processing" | "complete" | "error" }
  | { type: "AI_CANVAS_OPS"; operations: CanvasOp[] };

function getLiveblocksClient(): Liveblocks {
  if (!process.env.LIVEBLOCKS_SECRET_KEY) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  }
  return new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY });
}

async function broadcast(
  liveblocks: Liveblocks,
  roomId: string,
  event: AiRoomEvent
): Promise<void> {
  try {
    await liveblocks.broadcastEvent(roomId, event);
  } catch (err) {
    logger.warn("Failed to broadcast event", { roomId, eventType: (event as { type: string }).type, err });
  }
}

export const designAgent = task({
  id: "design-agent",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30_000,
    randomize: true,
  },
  run: async (payload: DesignAgentPayload) => {
    const { prompt, roomId } = payload;
    const liveblocks = getLiveblocksClient();

    logger.info("Design agent started", { roomId, prompt: prompt.slice(0, 100) });

    await broadcast(liveblocks, roomId, { type: "AI_THINKING", isThinking: true });
    await broadcast(liveblocks, roomId, {
      type: "AI_STATUS",
      message: "Analysing your prompt…",
      phase: "start",
    });

    let design: z.infer<typeof designSchema>;

    try {
      await broadcast(liveblocks, roomId, {
        type: "AI_STATUS",
        message: "Generating architecture…",
        phase: "processing",
      });

      const { text } = await generateText({
        model: google("gemini-2.5-flash"),
        system: `You are a system design expert. Return ONLY valid JSON — no markdown, no code fences, no explanation.

The JSON must have this exact structure:
{
  "nodes": [
    {
      "id": "unique-string",
      "label": "Display Name",
      "shape": "rectangle" | "diamond" | "circle" | "pill" | "cylinder" | "hexagon",
      "colorIndex": integer 0-7,
      "x": number,
      "y": number,
      "width": number (optional),
      "height": number (optional)
    }
  ],
  "edges": [
    {
      "id": "unique-string",
      "source": "node-id",
      "target": "node-id",
      "label": "optional string"
    }
  ]
}

Shape usage: rectangle=services/APIs, diamond=load balancers/decisions, circle=events/triggers, pill=microservices/workers, cylinder=databases/caches, hexagon=external systems.
colorIndex: 0=neutral, 1=blue(APIs), 2=purple(AI/ML), 3=orange(queues), 4=red(alerts), 5=pink(auth), 6=green(healthy), 7=teal(data stores).
Layout: 300-500px horizontal spacing, 200-300px vertical spacing, x:0-2000, y:0-1500, no overlapping nodes.`,
        prompt: `Generate a system architecture diagram for: ${prompt}

Create a realistic, production-ready design with 6-15 nodes, appropriate services, databases, and connections.
Use descriptive labels and connect all services with meaningful edges.`,
      });

      // Strip markdown code fences if the model includes them
      const jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const raw = JSON.parse(jsonText) as { nodes: unknown[]; edges: unknown[] };

      // Parse with coerced colorIndex so float values like 2.0 don't fail .int()
      const lenientNodeSchema = nodeSchema.extend({
        colorIndex: z.number().transform((v) => Math.max(0, Math.min(7, Math.floor(v)))),
        shape: z.string().transform((v) => (NODE_SHAPES.includes(v as typeof NODE_SHAPES[number]) ? v : "rectangle")),
      });
      const lenientSchema = designSchema.extend({
        nodes: z.array(lenientNodeSchema).min(1).max(20),
      });

      design = lenientSchema.parse(raw) as z.infer<typeof designSchema>;
      logger.info("AI design generated", { nodes: design.nodes.length, edges: design.edges.length });
    } catch (err) {
      logger.error("AI generation failed", { err });

      await broadcast(liveblocks, roomId, {
        type: "AI_STATUS",
        message: "Generation failed. Please try again.",
        phase: "error",
      });
      await broadcast(liveblocks, roomId, { type: "AI_THINKING", isThinking: false });

      throw err;
    }

    await broadcast(liveblocks, roomId, {
      type: "AI_STATUS",
      message: "Placing nodes on canvas…",
      phase: "processing",
    });

    const nodeOps: Array<{
      action: "add_node";
      node: { id: string; label: string; shape: string; colorFill: string; x: number; y: number; width: number; height: number };
    }> = design.nodes.map((n) => {
      const color = NODE_COLORS[Math.min(n.colorIndex, NODE_COLORS.length - 1)];
      const size = SHAPE_DEFAULT_SIZES[n.shape] ?? SHAPE_DEFAULT_SIZES.rectangle;
      return {
        action: "add_node",
        node: {
          id: n.id,
          label: n.label,
          shape: n.shape,
          colorFill: color.fill,
          x: n.x,
          y: n.y,
          width: n.width ?? size.width,
          height: n.height ?? size.height,
        },
      };
    });

    const edgeOps: Array<{
      action: "add_edge";
      edge: { id: string; source: string; target: string; label?: string };
    }> = design.edges
      .filter((e) => {
        const nodeIds = new Set(design.nodes.map((n) => n.id));
        return nodeIds.has(e.source) && nodeIds.has(e.target);
      })
      .map((e) => ({
        action: "add_edge",
        edge: { id: e.id, source: e.source, target: e.target, label: e.label },
      }));

    await broadcast(liveblocks, roomId, {
      type: "AI_CANVAS_OPS",
      operations: [...nodeOps, ...edgeOps],
    });

    await broadcast(liveblocks, roomId, {
      type: "AI_STATUS",
      message: `Added ${nodeOps.length} nodes and ${edgeOps.length} connections.`,
      phase: "complete",
    });
    await broadcast(liveblocks, roomId, { type: "AI_THINKING", isThinking: false });

    logger.info("Design agent complete", { roomId, nodes: nodeOps.length, edges: edgeOps.length });

    return { roomId, status: "ok", nodes: nodeOps.length, edges: edgeOps.length };
  },
});
