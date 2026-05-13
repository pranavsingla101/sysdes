"use client";

import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NODE_COLORS } from "@/types/canvas";
import { CANVAS_TEMPLATES, type CanvasTemplate } from "./starter-templates";

interface StarterTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (template: CanvasTemplate) => void;
}

export function StarterTemplatesModal({
  isOpen,
  onClose,
  onImport,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex max-h-[90vh] w-full max-w-[calc(100vw-32px)] sm:max-w-[calc(100vw-48px)] lg:max-w-[1200px] flex-col gap-0 overflow-hidden rounded-3xl border border-border-default bg-bg-surface p-0"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-border-default px-6 pt-7 pb-5 sm:px-9">
          <DialogTitle className="text-2xl font-semibold text-text-primary">
            Import Template
          </DialogTitle>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-text-muted">
            Choose a starter template to pre-populate your canvas. Any existing nodes will be
            replaced — use <kbd className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-xs text-text-faint">[⌘ Z]</kbd> to undo.
          </p>
        </DialogHeader>

        <div className="grid gap-6 overflow-y-auto p-4 sm:p-6 lg:grid-cols-3 lg:gap-8 lg:p-8">
          {CANVAS_TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onImport={() => {
                onImport(template);
                onClose();
              }}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({
  template,
  onImport,
}: {
  template: CanvasTemplate;
  onImport: () => void;
}) {
  return (
    <div className="grid min-h-[230px] overflow-hidden rounded-2xl border border-border-default bg-bg-elevated transition-colors hover:border-border-subtle md:grid-cols-[minmax(280px,1.1fr)_minmax(240px,0.9fr)] lg:min-h-[430px] lg:grid-cols-1">
      <div className="flex min-h-[210px] items-center bg-bg-base lg:min-h-0">
        <TemplatePreview template={template} />
      </div>
      <div className="flex min-w-0 flex-col justify-between gap-5 border-t border-border-default p-5 md:border-t-0 md:border-l lg:border-t lg:border-l-0">
        <div>
          <h3 className="text-base font-semibold leading-6 text-text-primary">{template.name}</h3>
          <p className="mt-2 text-sm leading-6 text-text-muted">{template.description}</p>
        </div>
        <button
          type="button"
          onClick={onImport}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-default px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:border-border-subtle hover:bg-bg-subtle hover:text-text-primary"
        >
          <Download className="h-4 w-4" />
          Import
        </button>
      </div>
    </div>
  );
}

// Logical preview canvas size — SVG renders at 100% width of container, PREVIEW_H px tall
const PREVIEW_W = 380;
const PREVIEW_H = 230;
const PREVIEW_PAD = 18;

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const { nodes, edges } = template;

  if (nodes.length === 0) {
    return <div style={{ height: PREVIEW_H }} />;
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of nodes) {
    const w = node.width ?? 110;
    const h = node.height ?? 62;
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + w);
    maxY = Math.max(maxY, node.position.y + h);
  }

  const boundsW = maxX - minX || 1;
  const boundsH = maxY - minY || 1;
  const availW = PREVIEW_W - PREVIEW_PAD * 2;
  const availH = PREVIEW_H - PREVIEW_PAD * 2;
  const scale = Math.min(availW / boundsW, availH / boundsH);

  const scaledW = boundsW * scale;
  const scaledH = boundsH * scale;
  const ox = PREVIEW_PAD + (availW - scaledW) / 2 - minX * scale;
  const oy = PREVIEW_PAD + (availH - scaledH) / 2 - minY * scale;

  function tx(x: number) { return x * scale + ox; }
  function ty(y: number) { return y * scale + oy; }

  const centerOf = new Map<string, { x: number; y: number }>();
  for (const node of nodes) {
    const w = node.width ?? 110;
    const h = node.height ?? 62;
    centerOf.set(node.id, { x: tx(node.position.x + w / 2), y: ty(node.position.y + h / 2) });
  }

  return (
    <svg
      viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`}
      className="h-[230px] w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Edges — draw before nodes so nodes sit on top */}
      {edges.map((edge) => {
        const src = centerOf.get(edge.source);
        const tgt = centerOf.get(edge.target);
        if (!src || !tgt) return null;
        return (
          <line
            key={edge.id}
            x1={src.x} y1={src.y}
            x2={tgt.x} y2={tgt.y}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1.2}
          />
        );
      })}
      {/* Nodes */}
      {nodes.map((node) => {
        const nw = (node.width ?? 110) * scale;
        const nh = (node.height ?? 62) * scale;
        const nx = tx(node.position.x);
        const ny = ty(node.position.y);
        const cx = nx + nw / 2;
        const cy = ny + nh / 2;
        const entry = NODE_COLORS.find((c) => c.fill === node.data.color);
        // Use the bright accent color as the preview fill so nodes pop visually
        const previewFill = entry?.text ?? "#EDEDED";
        return (
          <PreviewNode
            key={node.id}
            x={nx} y={ny} cx={cx} cy={cy}
            w={nw} h={nh}
            fill={previewFill}
            shape={node.data.shape}
          />
        );
      })}
    </svg>
  );
}

interface PreviewNodeProps {
  x: number;
  y: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
  fill: string;
  shape: string;
}

function PreviewNode({ x, y, cx, cy, w, h, fill, shape }: PreviewNodeProps) {
  const solidFill = fill;
  const dimFill = `${fill}66`;

  if (shape === "circle") {
    return <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} fill={solidFill} fillOpacity={0.85} />;
  }
  if (shape === "pill") {
    return <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={solidFill} fillOpacity={0.85} />;
  }
  if (shape === "diamond") {
    const pts = `${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`;
    return <polygon points={pts} fill={solidFill} fillOpacity={0.85} />;
  }
  if (shape === "hexagon") {
    const pts = `${x + w * 0.25},${y} ${x + w * 0.75},${y} ${x + w},${cy} ${x + w * 0.75},${y + h} ${x + w * 0.25},${y + h} ${x},${cy}`;
    return <polygon points={pts} fill={solidFill} fillOpacity={0.85} />;
  }
  if (shape === "cylinder") {
    const ry = Math.max(2, h * 0.18);
    return (
      <g fillOpacity={0.85}>
        <rect x={x} y={y + ry} width={w} height={h - ry * 2} fill={solidFill} />
        <ellipse cx={cx} cy={y + ry} rx={w / 2} ry={ry} fill={solidFill} />
        <ellipse cx={cx} cy={y + h - ry} rx={w / 2} ry={ry} fill={dimFill} />
      </g>
    );
  }
  // rectangle (default)
  return (
    <rect
      x={x} y={y}
      width={w} height={h}
      rx={Math.max(2, Math.min(5, w * 0.08))}
      fill={solidFill}
      fillOpacity={0.85}
    />
  );
}
