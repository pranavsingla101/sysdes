"use client";

import { useRef, useLayoutEffect, useState } from "react";
import { Bot, FileText, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [activeTab, setActiveTab] = useState("architect");
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 72), 160)}px`;
    }
  }, [prompt]);

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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-ai/20 text-accent-ai-text">
            <Bot className="h-5 w-5" />
          </div>
          <div className="grid gap-1">
            <h2 className="text-xl font-semibold leading-none text-text-primary">
              AI Workspace
            </h2>
            <p className="text-base font-medium text-text-muted">
              Collaborate with SYSDES AI
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
                  ? "bg-accent-ai text-white"
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
                  ? "bg-accent-ai text-white"
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
              {/* Empty State */}
              <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent-ai/10 text-accent-ai">
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
                      onClick={() => setPrompt(starter)}
                      className="rounded-full bg-bg-subtle px-4 py-2 text-sm font-medium text-accent-ai-text transition hover:bg-bg-elevated hover:text-white"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Demo Messages */}
              <div className="flex flex-col gap-6">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-3xl border-2 border-accent-ai/50 bg-accent-ai/10 px-5 py-4 text-text-primary shadow-sm shadow-accent-ai/5">
                    <p className="text-base font-medium leading-relaxed">
                      Let's design a microservices-based e-commerce platform.
                    </p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-3xl border border-border-default bg-bg-elevated px-5 py-4 text-accent-ai-text shadow-sm shadow-bg-base/50">
                    <p className="text-base font-medium leading-relaxed">
                      I've outlined a distributed architecture with separate services for Auth, Catalog, and Orders. Check the Specs tab for the full technical breakdown.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="shrink-0 border-t border-border-default p-7">
            <div className="relative flex items-end gap-3 rounded-[2rem] border border-border-default bg-bg-elevated p-3 focus-within:border-accent-ai/50 focus-within:ring-1 focus-within:ring-accent-ai/30 transition-all">
              <Textarea
                ref={textareaRef}
                placeholder="Ask SYSDES AI..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[72px] flex-1 border-0 bg-transparent py-2 pl-3 text-base text-text-primary placeholder:text-text-faint focus-visible:ring-0 resize-none shadow-none overflow-y-auto"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    setPrompt("");
                  }
                }}
              />
              <Button
                size="icon"
                disabled={!prompt.trim()}
                className="h-10 w-10 shrink-0 rounded-full bg-accent-ai text-white shadow-lg shadow-accent-ai/20 transition-all hover:bg-accent-ai/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Specs Tab */}
        <TabsContent
          value="specs"
          className="flex flex-1 flex-col overflow-hidden m-0 p-0"
        >
          <ScrollArea className="flex-1 p-7">
            <div className="flex flex-col gap-6">
              <Button className="h-12 w-full gap-2 rounded-2xl bg-accent-ai text-base font-semibold text-white shadow-lg shadow-accent-ai/20 hover:bg-accent-ai/90">
                <Sparkles className="h-4 w-4" />
                Generate Spec
              </Button>

              <div className="grid gap-3">
                <p className="text-sm font-semibold uppercase tracking-wider text-text-faint">
                  Project Specs
                </p>
                <div className="group relative rounded-3xl border border-border-default bg-bg-elevated p-5 transition hover:border-accent-ai/30 hover:bg-bg-subtle">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-bg-base text-accent-ai-text">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1 py-1">
                      <h4 className="truncate text-base font-semibold text-text-primary">
                        E-commerce Microservices
                      </h4>
                      <p className="mt-1 truncate text-sm font-medium text-text-muted">
                        Detailed architecture spec for a distributed system...
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-border-default/50 pt-4">
                    <span className="text-xs font-medium text-text-faint">
                      Updated 2h ago
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      className="h-8 px-3 text-xs font-semibold text-text-muted"
                    >
                      Download PDF
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
