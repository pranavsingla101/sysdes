"use client";

import { FolderOpen, Pencil, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import type { SerializedProject } from "@/lib/project-api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectDialogs } from "./project-dialogs-provider";

interface ProjectSidebarProps {
  activeProjectId?: string;
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
  activeProjectId,
  project,
  showActions,
}: {
  activeProjectId?: string;
  project: SerializedProject;
  showActions: boolean;
}) {
  const { openDeleteDialog, openRenameDialog } = useProjectDialogs();
  const isActive = activeProjectId === project.id;

  return (
    <div className="group px-4 py-2">
      <div
        className={[
          "flex min-w-0 items-center gap-2 rounded-2xl border px-3 py-3 transition-colors",
          isActive
            ? "border-border-subtle bg-accent-primary-dim"
            : "border-transparent hover:border-border-default hover:bg-bg-elevated",
        ].join(" ")}
      >
        <Link
          href={`/editor/${project.id}`}
          aria-current={isActive ? "page" : undefined}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-accent-primary" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-medium leading-5 text-text-primary">
              {project.name}
            </span>
          </span>
        </Link>
        {showActions && (
          <span className="flex shrink-0 items-center gap-1 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-within:opacity-100">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openRenameDialog(project)}
              className="text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
              aria-label={`Rename ${project.name}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openDeleteDialog(project)}
              className="text-text-secondary hover:bg-bg-subtle hover:text-state-error"
              aria-label={`Delete ${project.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </span>
        )}
      </div>
    </div>
  );
}

function ProjectList({
  activeProjectId,
  projects,
  label,
  showActions,
}: {
  activeProjectId?: string;
  projects: SerializedProject[];
  label: string;
  showActions: boolean;
}) {
  if (projects.length === 0) {
    return <EmptyPlaceholder label={label} />;
  }

  return (
    <div className="py-3">
      {projects.map((project) => (
        <ProjectItem
          key={project.id}
          activeProjectId={activeProjectId}
          project={project}
          showActions={showActions}
        />
      ))}
    </div>
  );
}

export function ProjectSidebar({
  activeProjectId,
  isOpen,
  onClose,
}: ProjectSidebarProps) {
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
          "fixed left-1 top-16 bottom-4 z-50 flex w-[25rem] max-w-[calc(100vw-0.5rem)] flex-col overflow-hidden",
          "rounded-3xl border border-border-default bg-bg-surface/95 shadow-2xl shadow-bg-base/40 backdrop-blur",
          "transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]",
        ].join(" ")}
        aria-label="Project sidebar"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border-default px-6">
          <span className="text-lg font-semibold text-text-primary">
            Projects
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs
            defaultValue="my-projects"
            className="flex flex-1 flex-col overflow-hidden"
          >
            <TabsList className="mx-5 mt-5 mb-0 h-11 w-auto shrink-0 rounded-2xl border border-border-default bg-bg-elevated p-1">
              <TabsTrigger
                value="my-projects"
                className="rounded-xl text-base font-medium data-active:bg-bg-base data-active:text-text-primary"
              >
                My Projects
              </TabsTrigger>
              <TabsTrigger
                value="shared"
                className="rounded-xl text-base font-medium data-active:bg-bg-base data-active:text-text-primary"
              >
                Shared
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-projects" className="flex-1 overflow-y-auto m-0 p-0">
              <ProjectList
                activeProjectId={activeProjectId}
                projects={ownedProjects}
                label="projects"
                showActions
              />
            </TabsContent>

            <TabsContent value="shared" className="flex-1 overflow-y-auto m-0 p-0">
              <ProjectList
                activeProjectId={activeProjectId}
                projects={sharedProjects}
                label="shared projects"
                showActions={false}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="shrink-0 border-t border-border-default p-4">
          <Button
            className="h-11 w-full gap-2 rounded-2xl bg-accent-primary text-base font-semibold text-bg-base hover:bg-accent-primary/90"
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
