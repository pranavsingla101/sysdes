"use client";

import { useRef, useLayoutEffect, useState, useEffect, useCallback } from "react";
import { AlertCircle, Bot, CheckCircle2, Download, FileText, Loader2, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAiRoom } from "./ai-room-context";
import type { AiChatMessage } from "@/types/tasks";
import ReactMarkdown from "react-markdown";
import { useRealtimeRun } from "@trigger.dev/react-hooks";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  roomId: string | null;
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

interface ProjectSpec {
  id: string;
  filename: string;
  createdAt: string;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AiSidebar({ isOpen, onClose, projectId, roomId }: AiSidebarProps) {
  const [activeTab, setActiveTab] = useState("architect");
  const [prompt, setPrompt] = useState("");

  const [specs, setSpecs] = useState<ProjectSpec[]>([]);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [specsError, setSpecsError] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<ProjectSpec | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // State machine: idle → calling → tracking → done | error
  type SpecStatus = "idle" | "calling" | "tracking" | "done" | "error";
  const [specStatus, setSpecStatus] = useState<SpecStatus>("idle");
  const [specRunId, setSpecRunId] = useState<string | undefined>(undefined);
  const [specToken, setSpecToken] = useState<string | undefined>(undefined);
  const [specGenError, setSpecGenError] = useState<string | null>(null);

  // Track the design-agent run to detect failures
  const [designRunId, setDesignRunId] = useState<string | undefined>(undefined);
  const [designToken, setDesignToken] = useState<string | undefined>(undefined);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isAiThinking, setAiThinking, latestStatus, chatMessages, senderName, sendChatMessage, getCanvasSnapshot } = useAiRoom();
  const sendError = latestStatus?.phase === "error";

  const fetchSpecs = useCallback(async () => {
    if (!projectId) return;
    setSpecsLoading(true);
    setSpecsError(false);
    try {
      const res = await fetch(`/api/projects/${projectId}/specs`);
      if (res.ok) {
        const data = await res.json() as { specs: ProjectSpec[] };
        setSpecs(data.specs);
      } else {
        setSpecsError(true);
      }
    } catch {
      setSpecsError(true);
    } finally {
      setSpecsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (activeTab === "specs") {
      fetchSpecs();
    }
  }, [activeTab, fetchSpecs]);

  async function openSpecPreview(spec: ProjectSpec) {
    setSelectedSpec(spec);
    setPreviewContent(null);
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/specs/${spec.id}/download`);
      if (res.ok) {
        const text = await res.text();
        setPreviewContent(text);
      }
    } finally {
      setPreviewLoading(false);
    }
  }

  function downloadSpec(spec: ProjectSpec) {
    const a = document.createElement("a");
    a.href = `/api/projects/${projectId}/specs/${spec.id}/download`;
    a.download = spec.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function handleGenerateSpec() {
    if (!projectId || !roomId) return;
    if (specStatus === "calling" || specStatus === "tracking") return;

    // Reset to calling state immediately so the button shows loading at once
    setSpecStatus("calling");
    setSpecGenError(null);

    const { nodes, edges } = getCanvasSnapshot();

    try {
      const triggerRes = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, chatHistory: chatMessages, nodes, edges }),
      });
      if (!triggerRes.ok) throw new Error(`Request failed (${triggerRes.status}) — try restarting the dev server`);
      const { runId } = await triggerRes.json() as { runId: string };

      const tokenRes = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      if (!tokenRes.ok) throw new Error("Could not get tracking token");
      const { token } = await tokenRes.json() as { token: string };

      // Keep runId/token set so specRun stays populated after completion
      setSpecRunId(runId);
      setSpecToken(token);
      setSpecStatus("tracking");
    } catch (err) {
      setSpecStatus("error");
      setSpecGenError(err instanceof Error ? err.message : "Spec generation failed");
    }
  }

  const isSpecInProgress = specStatus === "calling" || specStatus === "tracking";

  // Track the spec run with Trigger.dev realtime
  const { run: specRun } = useRealtimeRun(specRunId, {
    accessToken: specToken,
    enabled: specStatus === "tracking",
    onComplete: (_run, err) => {
      if (err) {
        setSpecStatus("error");
        setSpecGenError("Spec generation failed");
      } else {
        setSpecStatus("done");
        fetchSpecs();
      }
    },
  });

  // Track the design-agent run — if it fails without broadcasting Liveblocks events,
  // reset thinking state and show an error message in the chat
  useRealtimeRun(designRunId, {
    accessToken: designToken,
    enabled: !!designRunId && !!designToken,
    onComplete: (run, err) => {
      setDesignRunId(undefined);
      setDesignToken(undefined);
      const failed =
        err ||
        run.status === "FAILED" ||
        run.status === "TIMED_OUT" ||
        run.status === "CANCELED" ||
        run.status === "EXPIRED";
      if (failed) {
        setAiThinking(false);
        const errorMsg: AiChatMessage = {
          id: `${Date.now()}-err`,
          sender: "Sysdes AI",
          role: "assistant",
          content: "Something went wrong on my end. Please try again.",
          timestamp: Date.now(),
        };
        sendChatMessage(errorMsg);
      }
    },
  });

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 72), 160)}px`;
    }
  }, [prompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isAiThinking]);

  async function handleSend() {
    const content = prompt.trim();
    if (!content || isAiThinking || !projectId || !roomId) return;

    const msg: AiChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      sender: senderName || "User",
      role: "user",
      content,
      timestamp: Date.now(),
    };

    sendChatMessage(msg);
    setPrompt("");
    setAiThinking(true);

    try {
      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content, roomId, projectId }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const { runId } = await res.json() as { runId: string };

      // Fetch a realtime token so we can detect task failures
      const tokenRes = await fetch("/api/ai/design/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      if (tokenRes.ok) {
        const { token } = await tokenRes.json() as { token: string };
        setDesignRunId(runId);
        setDesignToken(token);
      }
    } catch {
      // API failed before the task even started — reset thinking so the user can retry
      setAiThinking(false);
      const errorMsg: AiChatMessage = {
        id: `${Date.now()}-err`,
        sender: "Sysdes AI",
        role: "assistant",
        content: "Something went wrong on my end. Please try again.",
        timestamp: Date.now(),
      };
      sendChatMessage(errorMsg);
    }
  }

  return (
    <aside
      className={cn(
        "fixed right-4 top-16 bottom-4 z-50 flex w-[29rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden",
        "rounded-3xl border border-border-default bg-bg-surface/95 shadow-2xl shadow-bg-base/70 backdrop-blur-xl",
        "transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-[calc(100%+1rem)]"
      )}
      aria-label="AI Workspace"
    >
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between border-b border-border-default px-7 py-6">
        <div className="flex gap-4">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-primary/20 text-accent-primary">
            <Bot className="h-5 w-5" />
            {isAiThinking && (
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-primary opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-accent-primary" />
              </span>
            )}
          </div>
          <div className="grid gap-1">
            <h2 className="text-xl font-semibold leading-none text-text-primary">
              AI Workspace
            </h2>
            <p className="text-base font-medium text-text-muted">
              {isAiThinking ? (
                <span className="flex items-center gap-1.5 text-accent-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Working…
                </span>
              ) : (
                "Collaborate with SYSDES AI"
              )}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-text-muted hover:bg-bg-elevated hover:text-text-primary"
          aria-label="Close AI Sidebar"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* ai-status-feed: latest status message */}
      {latestStatus?.text && (
        <div className="shrink-0 border-b border-border-default bg-accent-primary/5 px-7 py-3">
          <p className="text-sm font-medium text-accent-primary leading-relaxed">
            {latestStatus.text}
          </p>
        </div>
      )}

      <Tabs
        defaultValue="architect"
        className="flex flex-1 flex-col overflow-hidden"
        onValueChange={setActiveTab}
      >
        <div className="px-7 pt-5">
          <TabsList className="h-11 w-full rounded-2xl border border-border-default bg-bg-elevated p-1">
            <TabsTrigger
              value="architect"
              className={cn(
                "flex-1 rounded-xl text-base font-medium transition-colors",
                activeTab === "architect"
                  ? "bg-accent-primary text-bg-base"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className={cn(
                "flex-1 rounded-xl text-base font-medium transition-colors",
                activeTab === "specs"
                  ? "bg-accent-primary text-bg-base"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* AI Architect Tab */}
        <TabsContent
          value="architect"
          className="flex flex-1 flex-col overflow-hidden m-0 p-0"
        >
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-8 p-7">
              {chatMessages.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent-primary/10 text-accent-primary">
                    <Bot className="h-8 w-8" />
                  </div>
                  <div className="grid gap-2">
                    <h3 className="text-lg font-semibold text-text-primary">
                      How can I help you build today?
                    </h3>
                    <p className="max-w-[18rem] text-base font-medium leading-relaxed text-text-muted">
                      I can generate architectures, suggest components, and document your system.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {STARTER_PROMPTS.map((starter) => (
                      <button
                        key={starter}
                        type="button"
                        disabled={isAiThinking}
                        onClick={() => setPrompt(starter)}
                        className="rounded-full bg-bg-subtle px-4 py-2 text-sm font-medium text-accent-primary transition hover:bg-bg-elevated hover:text-text-primary disabled:pointer-events-none disabled:opacity-40"
                      >
                        {starter}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* ai-chat feed */
                <div className="flex flex-col gap-4">
                  {chatMessages.map((msg) => {
                    const isOwn = msg.sender === senderName;
                    return (
                      <div
                        key={msg.id}
                        className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-3xl px-5 py-4 shadow-sm",
                            isOwn
                              ? "border-2 border-accent-primary/50 bg-accent-primary/10 text-text-primary shadow-accent-primary/5"
                              : "border border-border-default bg-bg-elevated text-text-primary shadow-bg-base/50"
                          )}
                        >
                          {!isOwn && (
                            <p className="mb-1 text-xs font-semibold text-accent-primary">
                              {msg.sender}
                            </p>
                          )}
                          <p className="text-base font-medium leading-relaxed">
                            {msg.content}
                          </p>
                          <p
                            className={cn(
                              "mt-2 text-xs text-text-faint",
                              isOwn ? "text-right" : "text-left"
                            )}
                          >
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {isAiThinking && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-3xl border border-border-default bg-bg-elevated px-5 py-4 shadow-sm shadow-bg-base/50">
                        <p className="mb-1 text-xs font-semibold text-accent-primary">
                          Sysdes AI
                        </p>
                        <p className="flex items-center gap-2 text-base font-medium leading-relaxed text-text-muted">
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent-primary" />
                          Sysdes AI is analyzing your request…
                        </p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="shrink-0 border-t border-border-default p-7">
            <div
              className={cn(
                "relative flex items-end gap-3 rounded-[2rem] border bg-bg-elevated p-3 transition-all",
                isAiThinking
                  ? "border-accent-primary/30 opacity-70"
                  : "border-border-default focus-within:border-accent-primary/50 focus-within:ring-1 focus-within:ring-accent-primary/30"
              )}
            >
              <Textarea
                ref={textareaRef}
                placeholder={isAiThinking ? "AI is working…" : "Message the room…"}
                value={prompt}
                disabled={isAiThinking}
                onChange={(e) => {
                  setPrompt(e.target.value);
                }}
                className="min-h-[72px] flex-1 border-0 bg-transparent py-2 pl-3 text-base text-text-primary placeholder:text-text-faint focus-visible:ring-0 resize-none shadow-none overflow-y-auto disabled:cursor-not-allowed"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !isAiThinking) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                size="icon"
                disabled={!prompt.trim() || isAiThinking}
                onClick={handleSend}
                className="h-10 w-10 shrink-0 rounded-full bg-accent-primary text-bg-base shadow-lg shadow-accent-primary/20 transition-all hover:bg-accent-primary/90 disabled:opacity-50"
              >
                {isAiThinking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {sendError && (
              <div className="mt-3 flex items-center gap-2 text-xs text-state-error">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{latestStatus?.text ?? "Generation failed. Please try again."}</span>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Specs Tab */}
        <TabsContent
          value="specs"
          className="flex flex-1 flex-col overflow-hidden m-0 p-0"
        >
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-6 p-7">
              <Button
                disabled={isAiThinking || isSpecInProgress}
                onClick={handleGenerateSpec}
                className="h-12 w-full gap-2 rounded-2xl bg-accent-primary text-base font-semibold text-bg-base shadow-lg shadow-accent-primary/20 hover:bg-accent-primary/90 disabled:opacity-50"
              >
                {isSpecInProgress ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {specStatus === "calling"
                  ? "Starting…"
                  : specStatus === "tracking"
                  ? "Generating…"
                  : "Generate Spec"}
              </Button>

              {/* Tracking status banner */}
              {specStatus === "tracking" && (
                <div className="flex items-center gap-2 rounded-2xl border border-accent-primary/20 bg-accent-primary/5 px-4 py-3">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent-primary" />
                  <p className="text-sm font-medium text-accent-primary">
                    {typeof specRun?.metadata?.status === "string"
                      ? specRun.metadata.status
                      : "AI is writing your spec…"}
                  </p>
                </div>
              )}

              {/* Success banner */}
              {specStatus === "done" && (
                <div className="flex items-center gap-2 rounded-2xl border border-state-success/20 bg-state-success/5 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-state-success" />
                  <p className="text-sm font-medium text-state-success">Spec generated — see list below</p>
                </div>
              )}

              {/* Error banner */}
              {specStatus === "error" && specGenError && (
                <div className="flex items-center gap-2 rounded-2xl border border-state-error/20 bg-state-error/5 px-4 py-3">
                  <AlertCircle className="h-4 w-4 shrink-0 text-state-error" />
                  <p className="text-sm font-medium text-state-error">{specGenError}</p>
                </div>
              )}

              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-wider text-text-faint">
                    Project Specs
                  </p>
                  <button
                    type="button"
                    onClick={fetchSpecs}
                    disabled={specsLoading}
                    className="text-xs font-medium text-text-faint hover:text-text-muted disabled:opacity-40"
                  >
                    Refresh
                  </button>
                </div>

                {specsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
                  </div>
                ) : specsError ? (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-state-error/20 bg-state-error/5 py-8 text-center px-4">
                    <AlertCircle className="h-6 w-6 text-state-error" />
                    <p className="text-sm font-medium text-state-error">
                      Could not load specs — restart the dev server, then
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchSpecs}
                      className="h-8 rounded-xl px-3 text-xs font-semibold text-text-muted hover:bg-bg-elevated hover:text-text-primary"
                    >
                      Retry
                    </Button>
                  </div>
                ) : specs.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-border-default bg-bg-elevated py-10 text-center">
                    <FileText className="h-8 w-8 text-text-faint" />
                    <p className="text-sm font-medium text-text-muted">No specs generated yet</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {specs.map((spec) => (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => openSpecPreview(spec)}
                        className="group flex items-center gap-3 rounded-2xl border border-border-default bg-bg-elevated px-4 py-3 text-left transition hover:border-accent-primary/30 hover:bg-bg-subtle"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-accent-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-text-primary">
                            {spec.filename}
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-text-faint">
                            {formatDate(spec.createdAt)}
                          </p>
                        </div>
                        <Download
                          className="h-4 w-4 shrink-0 text-text-faint opacity-0 transition group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadSpec(spec);
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Spec Preview Modal */}
      <Dialog
        open={selectedSpec !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSpec(null);
            setPreviewContent(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="flex flex-col gap-0 p-0 w-[min(64rem,calc(100vw-2rem))] sm:max-w-none max-h-[88vh] overflow-hidden rounded-3xl border border-border-default bg-bg-surface shadow-2xl shadow-bg-base/80"
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between gap-4 border-b border-border-default px-7 py-5">
            <DialogTitle className="truncate text-base font-semibold text-text-primary">
              {selectedSpec?.filename ?? "Spec"}
            </DialogTitle>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectedSpec && downloadSpec(selectedSpec)}
                className="h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold text-text-muted hover:bg-bg-elevated hover:text-text-primary"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
              <DialogClose
                render={
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-text-faint hover:bg-bg-elevated hover:text-text-primary transition-colors"
                    aria-label="Close"
                  />
                }
              >
                <X className="h-4 w-4" />
              </DialogClose>
            </div>
          </div>

          {/* Scrollable content — native overflow-y-auto so height is always respected */}
          <div className="overflow-y-auto flex-1 min-h-0 px-8 py-7">
            {previewLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
              </div>
            ) : previewContent !== null ? (
              <div
                className={cn(
                  "prose prose-invert max-w-none",
                  // Base text
                  "prose-p:text-text-secondary prose-p:leading-7",
                  // Headings
                  "prose-headings:text-text-primary prose-headings:font-semibold prose-headings:tracking-tight",
                  "prose-h1:text-2xl prose-h1:mt-8 prose-h1:mb-4",
                  "prose-h2:text-xl prose-h2:mt-7 prose-h2:mb-3 prose-h2:border-b prose-h2:border-border-default prose-h2:pb-2",
                  "prose-h3:text-base prose-h3:mt-5 prose-h3:mb-2",
                  // Lists
                  "prose-ul:text-text-secondary prose-ol:text-text-secondary",
                  "prose-li:my-1",
                  // Strong / em
                  "prose-strong:text-text-primary prose-strong:font-semibold",
                  "prose-em:text-text-secondary",
                  // Code inline
                  "prose-code:rounded prose-code:bg-bg-subtle prose-code:px-1.5 prose-code:py-0.5 prose-code:text-accent-primary prose-code:text-[0.85em] prose-code:font-mono prose-code:before:content-none prose-code:after:content-none",
                  // Code blocks
                  "prose-pre:rounded-2xl prose-pre:bg-bg-elevated prose-pre:border prose-pre:border-border-default prose-pre:p-5",
                  "prose-pre:text-text-secondary prose-pre:text-sm",
                  // Blockquote
                  "prose-blockquote:border-l-accent-primary prose-blockquote:text-text-muted",
                  // HR
                  "prose-hr:border-border-default",
                  // Links
                  "prose-a:text-accent-primary prose-a:no-underline hover:prose-a:underline",
                )}
              >
                <ReactMarkdown>{previewContent}</ReactMarkdown>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-text-muted">
                Failed to load spec content.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
