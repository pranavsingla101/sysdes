"use client";

import {
  Component,
  type DragEvent,
  type ErrorInfo,
  type ReactNode,
  useState,
  useEffect,
  useRef,
} from "react";
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";
import { ClientSideSuspense } from "@liveblocks/react/suspense";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useUndo, useRedo, useUpdateMyPresence, useEventListener, useStorage, useMutation, useSelf } from "@liveblocks/react/suspense";
import { LiveList } from "@liveblocks/client";
import {
  Circle,
  Database,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
  type LucideIcon,
  Bot,
  FileText,
  LayoutTemplate,
  Loader2,
  MousePointer2,
} from "lucide-react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Handle,
  type OnConnect,
  type OnDelete,
  type OnEdgesChange,
  type OnNodesChange,
  type NodeProps,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  NodeResizer,
} from "@xyflow/react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAutosave } from "@/hooks/use-autosave";
import { useSaveStatus } from "./save-context";
import { CanvasControls } from "./canvas-controls";
import {
  NODE_COLORS,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
  type NodeShape,
} from "@/types/canvas";
import { cn } from "@/lib/utils";
import { CanvasEdge as CanvasEdgeRenderer } from "./canvas-edge";
import { StarterTemplatesModal } from "./starter-templates-modal";
import { useTemplateModal } from "./template-context";
import type { CanvasTemplate } from "./starter-templates";
import { PresenceAvatars } from "./presence-avatars";
import { LiveCursors } from "./live-cursors";
import { useAiRoom } from "./ai-room-context";
import { validateAiStatusPayload, validateAiChatMessage, type AiChatMessage } from "@/types/tasks";



const SHAPE_DRAG_MIME_TYPE = "application/sysdes-shape";

const SHAPE_DEFAULT_SIZES: Record<
  NodeShape,
  {
    width: number;
    height: number;
  }
> = {
  rectangle: { width: 168, height: 88 },
  diamond: { width: 144, height: 144 },
  circle: { width: 112, height: 112 },
  pill: { width: 168, height: 72 },
  cylinder: { width: 132, height: 104 },
  hexagon: { width: 152, height: 104 },
};

const SHAPE_TOOL_ITEMS: Array<{
  shape: NodeShape;
  label: string;
  Icon: LucideIcon;
}> = [
  { shape: "rectangle", label: "Rectangle", Icon: RectangleHorizontal },
  { shape: "diamond", label: "Diamond", Icon: Diamond },
  { shape: "circle", label: "Circle", Icon: Circle },
  { shape: "pill", label: "Pill", Icon: Pill },
  { shape: "cylinder", label: "Cylinder", Icon: Database },
  { shape: "hexagon", label: "Hexagon", Icon: Hexagon },
];

const nodeTypes = {
  canvasNode: CanvasShapeNode,
};

const edgeTypes = {
  canvasEdge: CanvasEdgeRenderer,
};


const defaultEdgeOptions = {
  type: "canvasEdge",
  animated: false,
};


interface ShapeDragPayload {
  shape: NodeShape;
  size: {
    width: number;
    height: number;
  };
}

interface CanvasRoomProps {
  roomId: string;
}

interface CanvasErrorBoundaryProps {
  children: ReactNode;
}

interface CanvasErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Liveblocks canvas connection failed", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center bg-bg-base px-6 text-center">
          <div className="grid max-w-md gap-3 rounded-3xl border border-border-default bg-bg-surface/95 p-6">
            <h2 className="text-lg font-semibold text-text-primary">
              Canvas connection failed
            </h2>
            <p className="text-sm leading-6 text-text-muted">
              Live collaboration could not start for this room. Refresh the
              workspace and try again.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function CanvasRoom({ roomId }: CanvasRoomProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, thinking: false }}
        initialStorage={{ aiChat: new LiveList([]) }}
      >
        <CanvasErrorBoundary>
          <ClientSideSuspense fallback={<CanvasLoading />}>
            <CanvasFlow roomId={roomId} />
          </ClientSideSuspense>
        </CanvasErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function CanvasLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-bg-base">
      <div className="rounded-2xl border border-border-default bg-bg-surface/90 px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.28em] text-text-faint">
        Loading canvas
      </div>
    </div>
  );
}

function CanvasFlow({ roomId }: { roomId: string }) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: {
        initial: [],
      },
      edges: {
        initial: [],
      },
    });

  return (
    <ReactFlowProvider>
      <CanvasFlowSurface
        roomId={roomId}
        edges={edges}
        nodes={nodes}
        onConnect={onConnect}
        onDelete={onDelete}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
      />
    </ReactFlowProvider>
  );
}

interface CanvasFlowSurfaceProps {
  roomId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  onNodesChange: OnNodesChange<CanvasNode>;
  onEdgesChange: OnEdgesChange<CanvasEdge>;
  onConnect: OnConnect;
  onDelete: OnDelete<CanvasNode, CanvasEdge>;
}

function CanvasFlowSurface({
  roomId,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onDelete,
}: CanvasFlowSurfaceProps) {
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow<CanvasNode, CanvasEdge>();
  const { isTemplatesOpen, closeTemplates } = useTemplateModal();
  const [dragGhost, setDragGhost] = useState<{
    shape: NodeShape;
    x: number;
    y: number;
  } | null>(null);

  const undo = useUndo();
  const redo = useRedo();
  const updateMyPresence = useUpdateMyPresence();

  const { status: autosaveStatus, save: saveNow } = useAutosave(roomId, nodes, edges);
  const { setStatus, registerSaveHandler } = useSaveStatus();
  const {
    setAiThinking: setContextAiThinking,
    setLatestStatus: setContextLatestStatus,
    setChatMessages,
    setSenderName,
    registerSendMessage,
    registerGetCanvasSnapshot,
  } = useAiRoom();
  const hasLoadedRef = useRef(false);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  const self = useSelf();
  const rawMessages = useStorage((root) => root.aiChat);

  const sendToStorage = useMutation(({ storage }, msg: AiChatMessage) => {
    const chat = storage.get("aiChat");
    if (!chat) return;
    chat.push(msg);
  }, []);

  useEffect(() => {
    const name = self?.info?.displayName;
    if (name) setSenderName(name);
  }, [self?.info?.displayName, setSenderName]);

  useEffect(() => {
    const validated = (rawMessages ?? [])
      .map(validateAiChatMessage)
      .filter((m): m is AiChatMessage => m !== null);
    setChatMessages(validated);
  }, [rawMessages, setChatMessages]);

  useEffect(() => {
    registerSendMessage(sendToStorage);
  }, [sendToStorage, registerSendMessage]);

  useEffect(() => {
    registerGetCanvasSnapshot(() => ({
      nodes: nodesRef.current,
      edges: edgesRef.current,
    }));
  }, [registerGetCanvasSnapshot]);

  useEffect(() => {
    setStatus(autosaveStatus);
  }, [autosaveStatus, setStatus]);

  useEffect(() => {
    registerSaveHandler(saveNow);
  }, [saveNow, registerSaveHandler]);

  useEffect(() => {
    async function loadSavedState() {
      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;

      // Only load if room is empty to avoid overwriting active collaboration
      if (nodes.length === 0 && edges.length === 0) {
        try {
          const response = await fetch(`/api/projects/${roomId}/canvas`);
          if (response.ok) {
            const data = await response.json();
            if (data.nodes?.length > 0 || data.edges?.length > 0) {
              onNodesChange(
                data.nodes.map((node: CanvasNode) => ({ type: "add", item: node }))
              );
              onEdgesChange(
                data.edges.map((edge: CanvasEdge) => ({ type: "add", item: edge }))
              );
              // Small delay to allow nodes to mount before fitting view
              setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 100);
            }
          }
        } catch (error) {
          console.error("Error loading saved canvas:", error);
        }
      }
    }

    loadSavedState();
  }, [roomId, onNodesChange, onEdgesChange, fitView, nodes.length, edges.length]);

  useKeyboardShortcuts({
    undo,
    redo,
    zoomIn,
    zoomOut,
  });

  const [aiStatus, setAiStatus] = useState<{
    message: string;
    phase: "start" | "processing" | "complete" | "error";
  } | null>(null);
  const [aiThinking, setAiThinking] = useState(false);

  useEventListener(({ event }) => {
    if (event.type === "AI_THINKING") {
      setAiThinking(event.isThinking);
      setContextAiThinking(event.isThinking);
      if (!event.isThinking) {
        setTimeout(() => {
          setAiStatus(null);
          setContextLatestStatus(null);
        }, 3000);
      }
    }

    if (event.type === "AI_STATUS") {
      setAiStatus({ message: event.message, phase: event.phase });
      const payload = validateAiStatusPayload({ text: event.message, phase: event.phase });
      if (payload) setContextLatestStatus(payload);
    }

    if (event.type === "AI_CANVAS_OPS") {
      const nodeChanges: Parameters<typeof onNodesChange>[0] = [];
      const edgeChanges: Parameters<typeof onEdgesChange>[0] = [];

      for (const op of event.operations) {
        if (op.action === "add_node") {
          const newNode: CanvasNode = {
            id: op.node.id,
            type: "canvasNode",
            position: { x: op.node.x, y: op.node.y },
            width: op.node.width,
            height: op.node.height,
            data: {
              label: op.node.label,
              color: op.node.colorFill as CanvasNode["data"]["color"],
              shape: op.node.shape as CanvasNode["data"]["shape"],
            },
          };
          nodeChanges.push({ type: "add", item: newNode });
        } else if (op.action === "delete_node") {
          nodeChanges.push({ type: "remove", id: op.nodeId });
        } else if (op.action === "move_node") {
          nodeChanges.push({ type: "position", id: op.nodeId, position: { x: op.x, y: op.y }, dragging: false });
        } else if (op.action === "resize_node") {
          nodeChanges.push({ type: "dimensions", id: op.nodeId, dimensions: { width: op.width, height: op.height }, setAttributes: false });
        } else if (op.action === "update_node_data") {
          const existing = nodes.find((n) => n.id === op.nodeId);
          if (existing) {
            const updated: CanvasNode = {
              ...existing,
              data: {
                ...existing.data,
                ...(op.label !== undefined ? { label: op.label } : {}),
                ...(op.colorFill !== undefined ? { color: op.colorFill as CanvasNode["data"]["color"] } : {}),
                ...(op.shape !== undefined ? { shape: op.shape as CanvasNode["data"]["shape"] } : {}),
              },
            };
            nodeChanges.push({ type: "replace", id: op.nodeId, item: updated });
          }
        } else if (op.action === "add_edge") {
          const newEdge: CanvasEdge = {
            id: op.edge.id,
            type: "canvasEdge",
            source: op.edge.source,
            target: op.edge.target,
            data: { label: op.edge.label },
          };
          edgeChanges.push({ type: "add", item: newEdge });
        } else if (op.action === "delete_edge") {
          edgeChanges.push({ type: "remove", id: op.edgeId });
        }
      }

      if (nodeChanges.length > 0) onNodesChange(nodeChanges);
      if (edgeChanges.length > 0) onEdgesChange(edgeChanges);

      setTimeout(() => fitView({ padding: 0.15, duration: 500 }), 150);
    }
  });

  function handleTemplateImport(template: CanvasTemplate) {
    onNodesChange(nodes.map((node) => ({ type: "remove" as const, id: node.id })));
    onEdgesChange(edges.map((edge) => ({ type: "remove" as const, id: edge.id })));
    onNodesChange(template.nodes.map((node) => ({ type: "add" as const, item: node })));
    onEdgesChange(template.edges.map((edge) => ({ type: "add" as const, item: edge })));
    setTimeout(() => fitView({ padding: 0.1, duration: 400 }), 80);
  }

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    updateMyPresence({
      cursor: {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      },
    });
  }

  function handleMouseLeave() {
    updateMyPresence({ cursor: null });
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (event.dataTransfer.types.includes(SHAPE_DRAG_MIME_TYPE)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setDragGhost((prev) =>
        prev ? { ...prev, x: event.clientX, y: event.clientY } : prev
      );
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    setDragGhost(null);

    const payload = parseShapeDragPayload(
      event.dataTransfer.getData(SHAPE_DRAG_MIME_TYPE)
    );

    if (!payload) {
      return;
    }

    event.preventDefault();

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    const counter = nodes.filter((node) =>
      node.id.startsWith(`${payload.shape}-`)
    ).length;
    const newNode: CanvasNode = {
      id: `${payload.shape}-${Date.now()}-${counter}`,
      type: "canvasNode",
      position: {
        x: position.x - payload.size.width / 2,
        y: position.y - payload.size.height / 2,
      },
      width: payload.size.width,
      height: payload.size.height,
      data: {
        label: "",
        color: NODE_COLORS[0].fill,
        shape: payload.shape,
      },
    };

    onNodesChange([{ type: "add", item: newNode }]);
  }

  return (
    <div
      className="relative h-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <ReactFlow
        className="bg-bg-base"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        fitView
        onConnect={onConnect}
        onDelete={onDelete}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
      >
        <svg style={{ position: "absolute", width: 0, height: 0 }}>
          <defs>
            <marker
              id="sysdes-arrowhead"
              markerHeight="7"
              markerWidth="7"
              orient="auto"
              refX="6"
              refY="3.5"
              viewBox="0 0 10 10"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                fill="currentColor"
                className="text-text-primary"
              />
            </marker>
          </defs>
        </svg>

        <Background
          color="var(--border-subtle)"
          gap={24}
          size={1}
          variant={BackgroundVariant.Dots}
        />
        <CanvasControls />
        <LiveCursors />
      </ReactFlow>
      <PresenceAvatars />
      <ShapePanel
        onShapeDragStart={(shape) =>
          setDragGhost({ shape, x: 0, y: 0 })
        }
        onShapeDragEnd={() => setDragGhost(null)}
      />
      {dragGhost && dragGhost.x !== 0 && (
        <ShapeDragGhost
          shape={dragGhost.shape}
          x={dragGhost.x}
          y={dragGhost.y}
        />
      )}
      <StarterTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={closeTemplates}
        onImport={handleTemplateImport}
      />
      <AiStatusOverlay status={aiStatus} thinking={aiThinking} />
    </div>
  );
}

interface ShapePanelProps {
  onShapeDragStart: (shape: NodeShape) => void;
  onShapeDragEnd: () => void;
}

function ShapePanel({ onShapeDragStart, onShapeDragEnd }: ShapePanelProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border-default bg-bg-surface/95 p-1 shadow-2xl shadow-bg-base/60 backdrop-blur">
        {SHAPE_TOOL_ITEMS.map(({ shape, label, Icon }) => (
          <button
            key={shape}
            type="button"
            className="flex h-10 w-10 cursor-grab items-center justify-center rounded-full border border-transparent text-text-muted transition hover:border-border-subtle hover:bg-bg-subtle hover:text-text-primary active:cursor-grabbing"
            draggable
            title={label}
            aria-label={label}
            onDragStart={(event) => {
              handleShapeDragStart(event, shape);
              onShapeDragStart(shape);
            }}
            onDragEnd={onShapeDragEnd}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

function handleShapeDragStart(
  event: DragEvent<HTMLButtonElement>,
  shape: NodeShape
) {
  const payload: ShapeDragPayload = {
    shape,
    size: SHAPE_DEFAULT_SIZES[shape],
  };

  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData(SHAPE_DRAG_MIME_TYPE, JSON.stringify(payload));

  const ghostImg = new Image();
  ghostImg.src =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  event.dataTransfer.setDragImage(ghostImg, 0, 0);
}

function parseShapeDragPayload(value: string): ShapeDragPayload | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<ShapeDragPayload>;

    if (
      !isNodeShape(parsed.shape) ||
      typeof parsed.size?.width !== "number" ||
      typeof parsed.size.height !== "number"
    ) {
      return null;
    }

    return {
      shape: parsed.shape,
      size: {
        width: parsed.size.width,
        height: parsed.size.height,
      },
    };
  } catch {
    return null;
  }
}

function isNodeShape(value: unknown): value is NodeShape {
  return typeof value === "string" && NODE_SHAPES.includes(value as NodeShape);
}

function NodeColorToolbar({
  activeColor,
  onColorSelect,
}: {
  activeColor: string;
  onColorSelect: (color: string) => void;
}) {
  return (
    <div className="nodrag nopan absolute bottom-full left-1/2 mb-4 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border-default bg-bg-surface/95 p-1.5 shadow-xl shadow-bg-base/40 backdrop-blur">
      {NODE_COLORS.map((color) => (
        <button
          key={color.fill}
          type="button"
          className={cn(
            "h-5 w-5 rounded-full border border-transparent transition-all hover:scale-110",
            activeColor === color.fill &&
              "scale-110 border-text-primary shadow-[0_0_8px_rgba(255,255,255,0.3)]"
          )}
          style={{
            backgroundColor: color.fill,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onColorSelect(color.fill);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `0 0 10px ${color.text}60`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow =
              activeColor === color.fill
                ? "0 0 8px rgba(255,255,255,0.3)"
                : "";
          }}
          aria-label={`Change color to ${color.fill}`}
        />
      ))}
    </div>
  );
}

function CanvasShapeNode({
  id,
  data,
  width,
  height,
  selected,
}: NodeProps<CanvasNode>) {
  const [isEditing, setIsEditing] = useState(false);
  const { updateNodeData } = useReactFlow();

  const fillColor = data.color;
  const textColor =
    NODE_COLORS.find((color) => color.fill === fillColor)?.text ??
    NODE_COLORS[0].text;
  const nodeWidth = width ?? SHAPE_DEFAULT_SIZES[data.shape].width;
  const nodeHeight = height ?? SHAPE_DEFAULT_SIZES[data.shape].height;

  return (
    <div
      className="group relative flex items-center justify-center text-center text-sm font-medium"
      style={{
        width: nodeWidth,
        height: nodeHeight,
        color: textColor,
      }}
      onDoubleClick={() => setIsEditing(true)}
    >
      {selected && (
        <NodeColorToolbar
          activeColor={fillColor}
          onColorSelect={(color) => updateNodeData(id, { color })}
        />
      )}
      <NodeResizer
        color="var(--accent-primary)"
        isVisible={selected}
        minWidth={60}
        minHeight={60}
        handleClassName="!h-2 !w-2 !border !border-bg-base !bg-accent-primary !rounded-sm"
      />
      <CanvasShapeBackground
        fillColor={fillColor}
        shape={data.shape}
        selected={selected}
      />
      <div className="relative z-10 flex h-full w-full items-center justify-center px-4 py-3">
        {isEditing ? (
          <textarea
            autoFocus
            className="nodrag nopan w-full resize-none bg-transparent text-center outline-none"
            rows={Math.max(1, data.label.split("\n").length)}
            value={data.label}
            onChange={(e) => updateNodeData(id, { label: e.target.value })}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsEditing(false);
              }
            }}
            placeholder="Label"
          />
        ) : (
          <div className="pointer-events-none w-full break-words">
            {data.label || (
              <span className="opacity-50">Label</span>
            )}
          </div>
        )}
      </div>
      <NodeConnectionHandles />
    </div>
  );
}

interface CanvasShapeBackgroundProps {
  fillColor: string;
  shape: NodeShape;
  selected?: boolean;
}

function CanvasShapeBackground({
  fillColor,
  shape,
  selected = false,
}: CanvasShapeBackgroundProps) {
  const svgStroke = selected ? "var(--accent-primary)" : "var(--border-subtle)";
  const svgStrokeWidth = selected ? "2" : "1.5";

  if (shape === "diamond") {
    return (
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full overflow-visible drop-shadow-lg"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <polygon
          fill={fillColor}
          points="50,1 99,50 50,99 1,50"
          stroke={svgStroke}
          strokeWidth={svgStrokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  if (shape === "hexagon") {
    return (
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full overflow-visible drop-shadow-lg"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <polygon
          fill={fillColor}
          points="25,1 75,1 99,50 75,99 25,99 1,50"
          stroke={svgStroke}
          strokeWidth={svgStrokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  if (shape === "cylinder") {
    return (
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full overflow-visible drop-shadow-lg"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path
          d="M8 18C8 8.6 26.8 1 50 1C73.2 1 92 8.6 92 18V82C92 91.4 73.2 99 50 99C26.8 99 8 91.4 8 82V18Z"
          fill={fillColor}
          stroke={svgStroke}
          strokeWidth={svgStrokeWidth}
          vectorEffect="non-scaling-stroke"
        />
        <ellipse
          cx="50"
          cy="18"
          fill="none"
          rx="42"
          ry="17"
          stroke={svgStroke}
          strokeWidth={svgStrokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  return (
    <div
      className={[
        "absolute inset-0 shadow-lg shadow-bg-base/40 transition-colors",
        selected
          ? "border-2 border-accent-primary"
          : "border border-border-subtle",
        shape === "circle" || shape === "pill" ? "rounded-full" : "",
        shape === "rectangle" ? "rounded-xl" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ backgroundColor: fillColor }}
    />
  );
}

interface ShapeDragGhostProps {
  shape: NodeShape;
  x: number;
  y: number;
}

function ShapeDragGhost({ shape, x, y }: ShapeDragGhostProps) {
  const { width, height } = SHAPE_DEFAULT_SIZES[shape];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-50"
      style={{
        left: x - width / 2,
        top: y - height / 2,
        width,
        height,
        opacity: 0.55,
      }}
    >
      <CanvasShapeBackground
        fillColor={NODE_COLORS[0].fill}
        shape={shape}
        selected={false}
      />
    </div>
  );
}

function NodeConnectionHandles() {
  const handleClass =
    "!h-2 !w-2 !border !border-bg-base !bg-text-primary !opacity-0 transition group-hover:!opacity-100";
  return (
    <>
      <Handle id="top" className={handleClass} position={Position.Top} type="source" />
      <Handle id="right" className={handleClass} position={Position.Right} type="source" />
      <Handle id="bottom" className={handleClass} position={Position.Bottom} type="source" />
      <Handle id="left" className={handleClass} position={Position.Left} type="source" />
    </>
  );
}

interface AiStatusOverlayProps {
  status: { message: string; phase: "start" | "processing" | "complete" | "error" } | null;
  thinking: boolean;
}

function AiStatusOverlay({ status, thinking }: AiStatusOverlayProps) {
  if (!status && !thinking) return null;

  const phaseColor =
    status?.phase === "error"
      ? "border-state-error/40 bg-state-error/10 text-state-error"
      : status?.phase === "complete"
      ? "border-state-success/40 bg-state-success/10 text-state-success"
      : "border-accent-ai/30 bg-accent-ai/10 text-accent-ai-text";

  return (
    <div className="pointer-events-none absolute left-1/2 top-5 z-20 -translate-x-1/2">
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-medium shadow-xl backdrop-blur-sm",
          phaseColor
        )}
      >
        {thinking && status?.phase !== "complete" && status?.phase !== "error" && (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
        )}
        <span>{status?.message ?? "AI is thinking…"}</span>
      </div>
    </div>
  );
}
