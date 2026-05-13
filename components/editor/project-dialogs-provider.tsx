"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { SerializedProject } from "@/lib/project-api";
import { useProjectActions } from "@/hooks/use-project-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ProjectDialogsContextValue {
  ownedProjects: SerializedProject[];
  sharedProjects: SerializedProject[];
  openCreateDialog: () => void;
  openRenameDialog: (project: SerializedProject) => void;
  openDeleteDialog: (project: SerializedProject) => void;
}

interface ProjectDialogsProviderProps {
  children: ReactNode;
  ownedProjects: SerializedProject[];
  sharedProjects: SerializedProject[];
}

const ProjectDialogsContext =
  createContext<ProjectDialogsContextValue | null>(null);

export function useProjectDialogs() {
  const context = useContext(ProjectDialogsContext);

  if (!context) {
    throw new Error(
      "useProjectDialogs must be used within ProjectDialogsProvider"
    );
  }

  return context;
}

export function ProjectDialogsProvider({
  children,
  ownedProjects,
  sharedProjects,
}: ProjectDialogsProviderProps) {
  const controller = useProjectActions();
  const { dialogState } = controller;

  return (
    <ProjectDialogsContext.Provider
      value={{
        ownedProjects,
        sharedProjects,
        openCreateDialog: controller.openCreateDialog,
        openRenameDialog: controller.openRenameDialog,
        openDeleteDialog: controller.openDeleteDialog,
      }}
    >
      {children}
      <Dialog
        open={dialogState.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            controller.closeDialog();
          }
        }}
      >
        <DialogContent className="rounded-3xl border border-border-default bg-bg-elevated text-text-primary sm:max-w-md">
          <form className="grid gap-4" onSubmit={controller.handleSubmit}>
            {dialogState.mode === "create" && (
              <>
                <DialogHeader>
                  <DialogTitle>Create Project</DialogTitle>
                  <DialogDescription>
                    Name the workspace before you start designing.
                  </DialogDescription>
                </DialogHeader>
                <label className="grid gap-2 text-sm text-text-secondary">
                  Project name
                  <Input
                    value={dialogState.projectName}
                    onChange={(event) =>
                      controller.setProjectName(event.target.value)
                    }
                    placeholder="Checkout Platform"
                    autoFocus
                    className="border-border-default bg-bg-surface text-text-primary placeholder:text-text-muted"
                  />
                </label>
                <div className="rounded-xl border border-border-default bg-bg-surface px-3 py-2 font-mono text-sm text-brand">
                  {dialogState.roomIdPreview}
                </div>
                {dialogState.errorMessage && (
                  <p className="text-sm text-state-error">
                    {dialogState.errorMessage}
                  </p>
                )}
                <DialogFooter className="border-border-default bg-bg-surface">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={controller.closeDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={dialogState.isLoading}
                    className="bg-accent-primary text-bg-base hover:bg-accent-primary/90"
                  >
                    Create Project
                  </Button>
                </DialogFooter>
              </>
            )}

            {dialogState.mode === "rename" && dialogState.selectedProject && (
              <>
                <DialogHeader>
                  <DialogTitle>Rename Project</DialogTitle>
                  <DialogDescription>
                    Current project: {dialogState.selectedProject.name}
                  </DialogDescription>
                </DialogHeader>
                <label className="grid gap-2 text-sm text-text-secondary">
                  Project name
                  <Input
                    value={dialogState.projectName}
                    onChange={(event) =>
                      controller.setProjectName(event.target.value)
                    }
                    autoFocus
                    className="border-border-default bg-bg-surface text-text-primary"
                  />
                </label>
                {dialogState.errorMessage && (
                  <p className="text-sm text-state-error">
                    {dialogState.errorMessage}
                  </p>
                )}
                <DialogFooter className="border-border-default bg-bg-surface">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={controller.closeDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={dialogState.isLoading}
                    className="bg-accent-primary text-bg-base hover:bg-accent-primary/90"
                  >
                    Rename
                  </Button>
                </DialogFooter>
              </>
            )}

            {dialogState.mode === "delete" && dialogState.selectedProject && (
              <>
                <DialogHeader>
                  <DialogTitle>Delete Project</DialogTitle>
                  <DialogDescription>
                    Delete {dialogState.selectedProject.name}? This removes the
                    project for everyone with access.
                  </DialogDescription>
                </DialogHeader>
                {dialogState.errorMessage && (
                  <p className="text-sm text-state-error">
                    {dialogState.errorMessage}
                  </p>
                )}
                <DialogFooter className="border-border-default bg-bg-surface">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={controller.closeDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={dialogState.isLoading}
                  >
                    Delete Project
                  </Button>
                </DialogFooter>
              </>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </ProjectDialogsContext.Provider>
  );
}
