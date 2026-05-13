"use client";

import {
  createContext,
  type FormEvent,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface MockProject {
  id: string;
  name: string;
  slug: string;
  ownerType: "owned" | "shared";
  updatedAt: string;
}

type ProjectDialogMode = "create" | "rename" | "delete";

interface ProjectDialogsContextValue {
  ownedProjects: MockProject[];
  sharedProjects: MockProject[];
  openCreateDialog: () => void;
  openRenameDialog: (project: MockProject) => void;
  openDeleteDialog: (project: MockProject) => void;
}

const MOCK_PROJECTS: MockProject[] = [
  {
    id: "checkout-platform",
    name: "Checkout Platform",
    slug: "checkout-platform",
    ownerType: "owned",
    updatedAt: "Updated today",
  },
  {
    id: "notification-mesh",
    name: "Notification Mesh",
    slug: "notification-mesh",
    ownerType: "owned",
    updatedAt: "Updated yesterday",
  },
  {
    id: "analytics-pipeline",
    name: "Analytics Pipeline",
    slug: "analytics-pipeline",
    ownerType: "shared",
    updatedAt: "Shared by Maya",
  },
];

const ProjectDialogsContext =
  createContext<ProjectDialogsContextValue | null>(null);

function slugifyProjectName(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled-project"
  );
}

function useProjectDialogController() {
  const [projects, setProjects] = useState<MockProject[]>(MOCK_PROJECTS);
  const [mode, setMode] = useState<ProjectDialogMode | null>(null);
  const [selectedProject, setSelectedProject] = useState<MockProject | null>(
    null
  );
  const [projectName, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const slugPreview = useMemo(
    () => slugifyProjectName(projectName),
    [projectName]
  );

  const ownedProjects = projects.filter(
    (project) => project.ownerType === "owned"
  );
  const sharedProjects = projects.filter(
    (project) => project.ownerType === "shared"
  );

  function closeDialog() {
    setMode(null);
    setSelectedProject(null);
    setProjectName("");
    setIsLoading(false);
  }

  function openCreateDialog() {
    setSelectedProject(null);
    setProjectName("");
    setMode("create");
  }

  function openRenameDialog(project: MockProject) {
    setSelectedProject(project);
    setProjectName(project.name);
    setMode("rename");
  }

  function openDeleteDialog(project: MockProject) {
    setSelectedProject(project);
    setProjectName("");
    setMode("delete");
  }

  function handleCreateProject() {
    const name = projectName.trim() || "Untitled Project";
    const slug = slugifyProjectName(name);

    setProjects((currentProjects) => [
      {
        id: `${slug}-${Date.now()}`,
        name,
        slug,
        ownerType: "owned",
        updatedAt: "Updated just now",
      },
      ...currentProjects,
    ]);
  }

  function handleRenameProject() {
    if (!selectedProject) {
      return;
    }

    const name = projectName.trim() || selectedProject.name;
    const slug = slugifyProjectName(name);

    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === selectedProject.id
          ? { ...project, name, slug, updatedAt: "Updated just now" }
          : project
      )
    );
  }

  function handleDeleteProject() {
    if (!selectedProject) {
      return;
    }

    setProjects((currentProjects) =>
      currentProjects.filter((project) => project.id !== selectedProject.id)
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    if (mode === "create") {
      handleCreateProject();
    }

    if (mode === "rename") {
      handleRenameProject();
    }

    if (mode === "delete") {
      handleDeleteProject();
    }

    closeDialog();
  }

  return {
    contextValue: {
      ownedProjects,
      sharedProjects,
      openCreateDialog,
      openRenameDialog,
      openDeleteDialog,
    },
    dialogState: {
      isOpen: mode !== null,
      mode,
      selectedProject,
      projectName,
      slugPreview,
      isLoading,
    },
    setProjectName,
    closeDialog,
    handleSubmit,
  };
}

export function useProjectDialogs() {
  const context = useContext(ProjectDialogsContext);

  if (!context) {
    throw new Error(
      "useProjectDialogs must be used within ProjectDialogsProvider"
    );
  }

  return context;
}

export function ProjectDialogsProvider({ children }: { children: ReactNode }) {
  const controller = useProjectDialogController();
  const { dialogState } = controller;

  return (
    <ProjectDialogsContext.Provider value={controller.contextValue}>
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
                  {dialogState.slugPreview}
                </div>
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
                    Delete {dialogState.selectedProject.name}? This mock action
                    removes it from the sidebar for this session.
                  </DialogDescription>
                </DialogHeader>
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
