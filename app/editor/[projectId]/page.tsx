import { notFound } from "next/navigation";
import { getAccessibleProject } from "@/lib/project-data";

interface ProjectWorkspacePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectWorkspacePage({
  params,
}: ProjectWorkspacePageProps) {
  const { projectId } = await params;
  const project = await getAccessibleProject(projectId);

  if (!project) {
    notFound();
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-6">
      <div className="flex max-w-xl flex-col items-center gap-3 text-center">
        <p className="font-mono text-sm text-brand">{project.id}</p>
        <h1 className="text-2xl font-semibold text-text-primary md:text-3xl">
          {project.name}
        </h1>
      </div>
    </div>
  );
}
