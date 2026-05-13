"use client";

import { useState } from "react";
import type { SerializedProject } from "@/lib/project-api";
import { EditorNavbar } from "./editor-navbar";
import { ProjectDialogsProvider } from "./project-dialogs-provider";
import { ProjectSidebar } from "./project-sidebar";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProjectDialogsProvider
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    >
      <EditorNavbar
        isSidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />
      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="pt-12 flex-1">{children}</main>
    </ProjectDialogsProvider>
  );
}
