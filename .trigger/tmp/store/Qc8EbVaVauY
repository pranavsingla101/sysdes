import {
  createGoogleGenerativeAI,
  external_exports,
  generateText
} from "../../../../chunk-N7GSBLHC.mjs";
import "../../../../chunk-ZNTURSTO.mjs";
import {
  logger,
  metadata,
  schemaTask
} from "../../../../chunk-2KCHITT6.mjs";
import "../../../../chunk-W3IIWYRQ.mjs";
import {
  __name,
  init_esm
} from "../../../../chunk-CEGEFIIW.mjs";

// trigger/generate-spec.ts
init_esm();
var google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
var AiChatMessageSchema = external_exports.object({
  id: external_exports.string(),
  sender: external_exports.string(),
  role: external_exports.enum(["user", "assistant"]),
  content: external_exports.string().min(1),
  timestamp: external_exports.number()
});
var CanvasNodeSchema = external_exports.object({
  id: external_exports.string(),
  data: external_exports.object({
    label: external_exports.string().optional(),
    shape: external_exports.string().optional()
  }).passthrough().optional(),
  position: external_exports.object({ x: external_exports.number(), y: external_exports.number() }).optional()
}).passthrough();
var CanvasEdgeSchema = external_exports.object({
  id: external_exports.string(),
  source: external_exports.string(),
  target: external_exports.string(),
  data: external_exports.object({ label: external_exports.string().optional() }).passthrough().optional()
}).passthrough();
var GenerateSpecSchema = external_exports.object({
  projectId: external_exports.string().min(1),
  roomId: external_exports.string().min(1),
  chatHistory: external_exports.array(AiChatMessageSchema).default([]),
  nodes: external_exports.array(CanvasNodeSchema).default([]),
  edges: external_exports.array(CanvasEdgeSchema).default([])
});
function buildPrompt(payload) {
  const { chatHistory, nodes, edges } = payload;
  const nodeLines = nodes.map((n) => {
    const label = n.data?.label ?? n.id;
    const shape = n.data?.shape ?? "rectangle";
    return `- ${label} (${shape}, id: ${n.id})`;
  }).join("\n");
  const edgeLines = edges.map((e) => {
    const label = e.data?.label ? ` [${e.data.label}]` : "";
    return `- ${e.source} → ${e.target}${label}`;
  }).join("\n");
  const chatLines = chatHistory.map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`).join("\n");
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
__name(buildPrompt, "buildPrompt");
var generateSpec = schemaTask({
  id: "generate-spec",
  schema: GenerateSpecSchema,
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1e3,
    maxTimeoutInMs: 3e4,
    randomize: true
  },
  run: /* @__PURE__ */ __name(async (payload) => {
    const { projectId, roomId } = payload;
    logger.info("generate-spec started", {
      projectId,
      roomId,
      nodes: payload.nodes.length,
      edges: payload.edges.length,
      chatMessages: payload.chatHistory.length
    });
    metadata.set("status", "starting").set("progress", 0);
    let specContent;
    try {
      metadata.set("status", "generating").set("progress", 20);
      const prompt = buildPrompt(payload);
      const { text } = await generateText({
        model: google("gemini-2.5-flash"),
        prompt
      });
      specContent = text.trim();
      metadata.set("status", "complete").set("progress", 100);
    } catch (err) {
      logger.error("Spec generation failed", { projectId, roomId, err });
      metadata.set("status", "error").set("progress", 0);
      throw err;
    }
    logger.info("generate-spec complete", {
      projectId,
      roomId,
      specLength: specContent.length
    });
    return { spec: specContent };
  }, "run")
});
export {
  generateSpec
};
//# sourceMappingURL=generate-spec.mjs.map
