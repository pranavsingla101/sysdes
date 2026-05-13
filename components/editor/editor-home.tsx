"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectDialogs } from "./project-dialogs-provider";

export function EditorHome() {
  const { openCreateDialog } = useProjectDialogs();

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-6">
      <div className="flex max-w-xl flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-semibold text-text-primary md:text-3xl">
          Create a project or open an existing one
        </h1>
        <p className="max-w-md text-sm leading-6 text-text-secondary">
          Start a new architecture workspace, or choose a project from the
          sidebar.
        </p>
        <Button
          onClick={openCreateDialog}
          className="gap-2 bg-accent-primary text-bg-base hover:bg-accent-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </div>
  );
}
