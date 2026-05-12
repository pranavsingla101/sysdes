"use client";

import { useState } from "react";
import { EditorNavbar } from "./editor-navbar";
import { ProjectDialogsProvider } from "./project-dialogs-provider";
import { ProjectSidebar } from "./project-sidebar";

export function EditorShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProjectDialogsProvider>
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
