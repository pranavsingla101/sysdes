import { Bot, Compass, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/editor/access-denied";
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
    <section className="flex h-[calc(100vh-3.5rem)] min-h-0 gap-1 bg-bg-base px-1 pb-1 lg:gap-2 lg:pr-1">
      <div className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden rounded-3xl border border-border-default bg-bg-base px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_0%,var(--accent-primary-dim),transparent_34%),radial-gradient(circle_at_88%_92%,color-mix(in_srgb,var(--accent-ai)_16%,transparent),transparent_28%)]" />
        <div className="relative grid max-w-2xl justify-items-center gap-7 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-border-subtle bg-bg-elevated/80 text-brand shadow-2xl shadow-bg-base/70">
            <Compass className="h-9 w-9" />
          </div>
          <div className="grid gap-4">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.36em] text-text-faint">
              Workspace Shell
            </p>
            <h1 className="max-w-xl text-balance text-3xl font-semibold leading-tight text-text-primary md:text-4xl">
              Canvas and collaboration tooling land here next.
            </h1>
            <p className="max-w-2xl text-base font-medium leading-8 text-text-muted">
              This room is ready for the shared architecture canvas, durable AI
              workflows, and real-time presence. For now, the shell is wired
              with project context and navigation only.
            </p>
          </div>
        </div>
      </div>
      <aside className="hidden w-[29rem] shrink-0 overflow-hidden rounded-3xl border border-border-default bg-bg-surface/95 backdrop-blur">
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
