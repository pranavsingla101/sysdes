"use client";

import { FolderOpen, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type MockProject,
  useProjectDialogs,
} from "./project-dialogs-provider";

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

function ProjectItem({
  project,
  showActions,
}: {
  project: MockProject;
  showActions: boolean;
}) {
  const { openDeleteDialog, openRenameDialog } = useProjectDialogs();

  return (
    <div className="group flex items-center gap-2 border-b border-border-default px-3 py-2 last:border-b-0">
      <button
        type="button"
        className="min-w-0 flex-1 rounded-xl px-2 py-2 text-left hover:bg-bg-elevated"
      >
        <span className="block truncate text-sm font-medium text-text-primary">
          {project.name}
        </span>
        <span className="block truncate text-xs text-text-muted">
          {project.updatedAt}
        </span>
      </button>
      {showActions && (
        <div className="flex shrink-0 items-center gap-1 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openRenameDialog(project)}
            className="text-text-muted hover:bg-bg-elevated hover:text-text-primary"
            aria-label={`Rename ${project.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openDeleteDialog(project)}
            className="text-text-muted hover:bg-bg-elevated hover:text-state-error"
            aria-label={`Delete ${project.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function ProjectList({
  projects,
  label,
  showActions,
}: {
  projects: MockProject[];
  label: string;
  showActions: boolean;
}) {
  if (projects.length === 0) {
    return <EmptyPlaceholder label={label} />;
  }

  return (
    <div className="py-2">
      {projects.map((project) => (
        <ProjectItem
          key={project.id}
          project={project}
          showActions={showActions}
        />
      ))}
    </div>
  );
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  const { ownedProjects, sharedProjects, openCreateDialog } =
    useProjectDialogs();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-bg-base/70 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          "fixed top-0 left-0 z-50 h-full w-72 flex flex-col",
          "bg-bg-surface border-r border-border-default",
          "transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-label="Project sidebar"
      >
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
              <ProjectList
                projects={ownedProjects}
                label="projects"
                showActions
              />
            </TabsContent>

            <TabsContent value="shared" className="flex-1 overflow-y-auto m-0 p-0">
              <ProjectList
                projects={sharedProjects}
                label="shared projects"
                showActions={false}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-3 border-t border-border-default shrink-0">
          <Button
            className="w-full gap-2 bg-accent-primary text-bg-base hover:bg-accent-primary/90"
            size="sm"
            onClick={openCreateDialog}
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
