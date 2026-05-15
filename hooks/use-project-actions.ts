"use client";

import { type Dispatch, type FormEvent, type SetStateAction, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SerializedProject } from "@/lib/project-api";

type ProjectDialogMode = "create" | "rename" | "delete";

interface ProjectMutationResponse {
  project?: SerializedProject;
  error?: {
    message?: string;
  };
}

function slugifyProjectName(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled-project"
  );
}

function generateShortSuffix() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => byte.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 6);
}

async function readProjectMutationResponse(response: Response) {
  const data = (await response.json()) as ProjectMutationResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Project request failed.");
  }

  if (!data.project) {
    throw new Error("Project response did not include a project.");
  }

  return data.project;
}

function isActiveWorkspace(pathname: string, projectId: string) {
  return pathname === `/editor/${projectId}` ||
    pathname.startsWith(`/editor/${projectId}/`);
}

interface UseProjectActionsOptions {
  setOwnedProjects: Dispatch<SetStateAction<SerializedProject[]>>;
}

export function useProjectActions({ setOwnedProjects }: UseProjectActionsOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const [mode, setMode] = useState<ProjectDialogMode | null>(null);
  const [selectedProject, setSelectedProject] =
    useState<SerializedProject | null>(null);
  const [projectName, setProjectName] = useState("");
  const [createSuffix, setCreateSuffix] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const roomIdPreview = useMemo(() => {
    const slug = slugifyProjectName(projectName);
    return createSuffix ? `${slug}-${createSuffix}` : slug;
  }, [createSuffix, projectName]);

  function closeDialog() {
    setMode(null);
    setSelectedProject(null);
    setProjectName("");
    setCreateSuffix("");
    setIsLoading(false);
    setErrorMessage(null);
  }

  function openCreateDialog() {
    setSelectedProject(null);
    setProjectName("");
    setCreateSuffix(generateShortSuffix());
    setErrorMessage(null);
    setMode("create");
  }

  function openRenameDialog(project: SerializedProject) {
    setSelectedProject(project);
    setProjectName(project.name);
    setCreateSuffix("");
    setErrorMessage(null);
    setMode("rename");
  }

  function openDeleteDialog(project: SerializedProject) {
    setSelectedProject(project);
    setProjectName("");
    setCreateSuffix("");
    setErrorMessage(null);
    setMode("delete");
  }

  async function handleCreateProject() {
    const name = projectName.trim() || "Untitled Project";
    const project = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: roomIdPreview, name }),
    }).then(readProjectMutationResponse);

    setOwnedProjects((prev) => [...prev, project]);
    closeDialog();
    router.push(`/editor/${project.id}`);
  }

  async function handleRenameProject() {
    if (!selectedProject) return;

    const updatedName = projectName.trim() || selectedProject.name;
    await fetch(`/api/projects/${selectedProject.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: updatedName }),
    }).then(readProjectMutationResponse);

    setOwnedProjects((prev) =>
      prev.map((p) =>
        p.id === selectedProject.id ? { ...p, name: updatedName } : p
      )
    );
    closeDialog();
  }

  async function handleDeleteProject() {
    if (!selectedProject) return;

    await fetch(`/api/projects/${selectedProject.id}`, {
      method: "DELETE",
    }).then(readProjectMutationResponse);

    const deletedId = selectedProject.id;
    const shouldRedirect = isActiveWorkspace(pathname, deletedId);
    setOwnedProjects((prev) => prev.filter((p) => p.id !== deletedId));
    closeDialog();

    if (shouldRedirect) {
      router.replace("/editor");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (mode === "create") {
        await handleCreateProject();
      }

      if (mode === "rename") {
        await handleRenameProject();
      }

      if (mode === "delete") {
        await handleDeleteProject();
      }
    } catch (error) {
      setIsLoading(false);
      setErrorMessage(
        error instanceof Error ? error.message : "Project request failed."
      );
    }
  }

  return {
    dialogState: {
      errorMessage,
      isLoading,
      isOpen: mode !== null,
      mode,
      projectName,
      roomIdPreview,
      selectedProject,
    },
    closeDialog,
    handleSubmit,
    openCreateDialog,
    openDeleteDialog,
    openRenameDialog,
    setProjectName,
  };
}
