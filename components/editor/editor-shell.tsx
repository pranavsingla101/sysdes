"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import type { SerializedProject } from "@/lib/project-api";
import { EditorNavbar } from "./editor-navbar";
import { ProjectDialogsProvider } from "./project-dialogs-provider";
import { ProjectSidebar } from "./project-sidebar";
import { ShareDialog } from "./share-dialog";
import { TemplateProvider } from "./template-context";
import { SaveProvider } from "./save-context";
import { AiSidebar } from "./ai-sidebar";
import { AiRoomProvider } from "./ai-room-context";

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
    <AiRoomProvider>
    <TemplateProvider>
    <SaveProvider>
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
      <AiSidebar
        isOpen={aiSidebarOpen && !!activeProjectId}
        onClose={() => setAiSidebarOpen(false)}
        projectId={activeProjectId ?? null}
        roomId={activeProjectId ?? null}
      />
      <main className="flex-1 pt-14">
        <div>
          {children}
        </div>
      </main>
    </ProjectDialogsProvider>
    </SaveProvider>
    </TemplateProvider>
    </AiRoomProvider>
  );
}
