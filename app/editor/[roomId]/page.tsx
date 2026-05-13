import { Bot, Sparkles } from "lucide-react";
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
      <aside className="absolute top-4 right-4 bottom-4 z-30 hidden w-[29rem] overflow-hidden rounded-3xl border border-border-default bg-bg-surface/90 shadow-2xl shadow-bg-base/70 backdrop-blur-xl">
        <div className="flex items-start justify-between border-b border-border-default px-7 py-6">
          <div className="grid gap-1">
            <h2 className="text-xl font-semibold leading-none text-text-primary">
              AI Copilot
            </h2>
            <p className="text-base font-medium text-text-faint">
              Placeholder panel
            </p>
          </div>
          <Sparkles className="h-5 w-5 text-accent-ai-text" />
        </div>
        <div className="flex h-[calc(100%-5.5rem)] flex-col justify-between p-7">
          <div className="rounded-3xl border border-border-default bg-bg-elevated/60 p-7">
            <div className="flex gap-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-ai/20 text-accent-ai-text">
                <Bot className="h-5 w-5" />
              </div>
              <div className="grid gap-1">
                <h3 className="text-lg font-semibold text-text-primary">
                  Chat surface pending
                </h3>
                <p className="text-base font-medium leading-7 text-text-muted">
                  The toggle is wired. Messaging and generation are
                  intentionally out of scope here.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-dashed border-border-default bg-bg-base/50 p-7">
            <p className="font-mono text-sm font-semibold uppercase tracking-[0.34em] text-text-faint">
              Future hooks
            </p>
            <p className="mt-4 text-base font-medium leading-8 text-text-muted">
              Prompt composer, run status, and architecture guidance will attach
              to this sidebar.
            </p>
          </div>
        </div>
      </aside>
    </section>
  );
}
