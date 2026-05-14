import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/editor/access-denied";
import { CanvasRoom } from "@/components/editor/canvas-room";
import {
  getCurrentProjectIdentity,
  getProjectByAccess,
} from "@/lib/project-access";

interface ProjectWorkspacePageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default async function ProjectWorkspacePage({
  params,
}: ProjectWorkspacePageProps) {
  const { roomId } = await params;
  const identity = await getCurrentProjectIdentity();

  if (!identity) {
    redirect("/sign-in");
  }

  const project = await getProjectByAccess(roomId, identity);

  if (!project) {
    return <AccessDenied />;
  }

  return (
    <section className="relative h-[calc(100vh-3.5rem)] min-h-0 overflow-hidden bg-bg-base">
      <div className="absolute inset-0 overflow-hidden bg-bg-base">
        <CanvasRoom roomId={project.id} />
      </div>
    </section>
  );
}
