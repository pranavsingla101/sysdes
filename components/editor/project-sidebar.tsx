"use client";

import { X, Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function EmptyPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <FolderOpen className="h-8 w-8 text-text-faint" />
      <p className="text-sm text-text-muted">No {label} yet</p>
    </div>
  );
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          "fixed top-0 left-0 z-50 h-full w-72 flex flex-col",
          "bg-bg-surface border-r border-border-default",
          "transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-label="Project sidebar"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-border-default shrink-0">
          <span className="text-sm font-medium text-text-primary">Projects</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="my-projects" className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="mx-3 mt-3 mb-0 h-8 bg-bg-elevated shrink-0">
              <TabsTrigger value="my-projects" className="flex-1 text-xs">
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex-1 text-xs">
                Shared
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-projects" className="flex-1 overflow-y-auto m-0 p-0">
              <EmptyPlaceholder label="projects" />
            </TabsContent>

            <TabsContent value="shared" className="flex-1 overflow-y-auto m-0 p-0">
              <EmptyPlaceholder label="shared projects" />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border-default shrink-0">
          <Button
            className="w-full gap-2 bg-accent-primary text-bg-base hover:bg-accent-primary/90"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
