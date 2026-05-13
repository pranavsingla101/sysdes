import { EditorShell } from "@/components/editor/editor-shell";
import { getEditorProjects } from "@/lib/project-data";

export default async function EditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { ownedProjects, sharedProjects } = await getEditorProjects();

  return (
    <EditorShell ownedProjects={ownedProjects} sharedProjects={sharedProjects}>
      {children}
    </EditorShell>
  );
}
