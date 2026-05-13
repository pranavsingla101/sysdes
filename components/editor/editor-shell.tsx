"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import type { SerializedProject } from "@/lib/project-api";
import { EditorNavbar } from "./editor-navbar";
import { ProjectDialogsProvider } from "./project-dialogs-provider";
import { ProjectSidebar } from "./project-sidebar";
import { ShareDialog } from "./share-dialog";

interface EditorShellProps {
  children: React.ReactNode;
  ownedProjects: SerializedProject[];
  sharedProjects: SerializedProject[];
}

export function EditorShell({
  children,
  ownedProjects,
  sharedProjects,
}: EditorShellProps) {
  const pathname = usePathname();
  const activeProjectId = pathname.startsWith("/editor/")
    ? pathname.split("/")[2]
    : undefined;
  const [sidebarOpen, setSidebarOpen] = useState(Boolean(activeProjectId));
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const activeProject = [...ownedProjects, ...sharedProjects].find(
    (project) => project.id === activeProjectId
  );
  const isOwner = ownedProjects.some((project) => project.id === activeProjectId);

  return (
    <ProjectDialogsProvider
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    >
      <EditorNavbar
        isAiSidebarOpen={aiSidebarOpen}
        isSidebarOpen={sidebarOpen}
        projectName={activeProject?.name}
        onOpenShareDialog={() => setShareDialogOpen(true)}
        onToggleAiSidebar={() => setAiSidebarOpen((prev) => !prev)}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />
      <ShareDialog
        isOpen={shareDialogOpen}
        isOwner={isOwner}
        projectId={activeProject?.id ?? null}
        projectName={activeProject?.name ?? null}
        onOpenChange={setShareDialogOpen}
      />
      <ProjectSidebar
        activeProjectId={activeProjectId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 pt-14">
        <div
          className={[
            "transition-[padding] duration-200 ease-in-out",
            sidebarOpen && activeProjectId ? "lg:pl-[26.75rem]" : "",
            aiSidebarOpen && activeProjectId ? "lg:[&>section>aside]:block" : "",
          ].join(" ")}
        >
          {children}
        </div>
      </main>
    </ProjectDialogsProvider>
  );
}
