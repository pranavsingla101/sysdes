"use client";

import { UserButton } from "@clerk/nextjs";
import { Bot, LayoutTemplate, PanelLeftClose, PanelLeftOpen, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTemplateModal } from "./template-context";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  isAiSidebarOpen: boolean;
  projectName?: string;
  onOpenShareDialog: () => void;
  onToggleAiSidebar: () => void;
  onToggleSidebar: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  isAiSidebarOpen,
  projectName,
  onOpenShareDialog,
  onToggleAiSidebar,
  onToggleSidebar,
}: EditorNavbarProps) {
  const { openTemplates } = useTemplateModal();
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center px-3 bg-bg-surface border-b border-border-default">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-8 w-8 text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>
        {projectName && (
          <div className="min-w-0 leading-none">
            <h1 className="truncate text-[15px] font-semibold text-text-primary">
              {projectName}
            </h1>
            <p className="mt-1 truncate text-xs font-medium text-text-faint">
              Workspace
            </p>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {projectName && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={openTemplates}
              className="h-8 gap-2 rounded-xl bg-bg-elevated px-3 text-sm font-medium text-text-muted hover:bg-bg-subtle hover:text-text-primary"
            >
              <LayoutTemplate className="h-4 w-4" />
              Templates
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenShareDialog}
              className="h-8 gap-2 rounded-xl bg-bg-elevated px-3 text-sm font-medium text-text-muted hover:bg-bg-subtle hover:text-text-primary"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onToggleAiSidebar}
              className="h-8 gap-2 rounded-xl bg-accent-primary px-3 text-sm font-semibold text-bg-base hover:bg-accent-primary/90"
              aria-label={
                isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"
              }
            >
              <Bot className="h-4 w-4" />
              AI
            </Button>
          </>
        )}
        <UserButton />
      </div>
    </header>
  );
}
