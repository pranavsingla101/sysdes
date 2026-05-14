import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutosave(
  projectId: string,
  nodes: CanvasNode[],
  edges: CanvasEdge[]
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  nodesRef.current = nodes;
  edgesRef.current = edges;

  const save = useCallback(async () => {
    const currentData = JSON.stringify({ nodes: nodesRef.current, edges: edgesRef.current });
    if (currentData === lastSavedRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setStatus("saving");
    try {
      const response = await fetch(`/api/projects/${projectId}/canvas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: currentData,
      });

      if (!response.ok) throw new Error("Save failed");

      lastSavedRef.current = currentData;
      setStatus("saved");
      setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 3000);
    } catch (error) {
      console.error("Autosave error:", error);
      setStatus("error");
      setTimeout(() => setStatus((s) => (s === "error" ? "idle" : s)), 3000);
    }
  }, [projectId]);

  useEffect(() => {
    const currentData = JSON.stringify({ nodes, edges });
    if (currentData === lastSavedRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(save, 3000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [nodes, edges, save]);

  return { status, save };
}
