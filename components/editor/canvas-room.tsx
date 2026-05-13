"use client";

import {
  Component,
  type DragEvent,
  type ErrorInfo,
  type ReactNode,
  useState,
} from "react";
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";
import { ClientSideSuspense } from "@liveblocks/react/suspense";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useUndo, useRedo } from "@liveblocks/react/suspense";
import {
  Circle,
  Database,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
  type LucideIcon,
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
        initialPresence={{ cursor: null, isThinking: false }}
      >
        <CanvasErrorBoundary>
          <ClientSideSuspense fallback={<CanvasLoading />}>
            <CanvasFlow />
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

function CanvasFlow() {
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
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  onNodesChange: OnNodesChange<CanvasNode>;
  onEdgesChange: OnEdgesChange<CanvasEdge>;
  onConnect: OnConnect;
  onDelete: OnDelete<CanvasNode, CanvasEdge>;
}

function CanvasFlowSurface({
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

  useKeyboardShortcuts({
    undo,
    redo,
    zoomIn,
    zoomOut,
  });

  function handleTemplateImport(template: CanvasTemplate) {
    onNodesChange(nodes.map((node) => ({ type: "remove" as const, id: node.id })));
    onEdgesChange(edges.map((edge) => ({ type: "remove" as const, id: edge.id })));
    onNodesChange(template.nodes.map((node) => ({ type: "add" as const, item: node })));
    onEdgesChange(template.edges.map((edge) => ({ type: "add" as const, item: edge })));
    setTimeout(() => fitView({ padding: 0.1, duration: 400 }), 80);
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
    <div className="relative h-full" onDragOver={handleDragOver} onDrop={handleDrop}>
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
      </ReactFlow>
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
  return (
    <>
      <Handle
        className="!h-2 !w-2 !border !border-bg-base !bg-text-primary !opacity-0 transition group-hover:!opacity-100"
        position={Position.Top}
        type="source"
      />
      <Handle
        className="!h-2 !w-2 !border !border-bg-base !bg-text-primary !opacity-0 transition group-hover:!opacity-100"
        position={Position.Right}
        type="source"
      />
      <Handle
        className="!h-2 !w-2 !border !border-bg-base !bg-text-primary !opacity-0 transition group-hover:!opacity-100"
        position={Position.Bottom}
        type="source"
      />
      <Handle
        className="!h-2 !w-2 !border !border-bg-base !bg-text-primary !opacity-0 transition group-hover:!opacity-100"
        position={Position.Left}
        type="source"
      />
    </>
  );
}

