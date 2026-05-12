import { Bot, FileText, Network } from "lucide-react";

interface AuthPanelProps {
  children: React.ReactNode;
}

const featureList = [
  {
    icon: Bot,
    title: "AI Architecture Generation",
    description:
      "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Network,
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileText,
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

export function AuthPanel({ children }: AuthPanelProps) {
  return (
    <main className="min-h-screen bg-bg-base font-sans text-text-primary lg:grid lg:grid-cols-[45%_55%]">
      <section className="hidden min-h-screen border-r border-border-default bg-bg-surface px-10 py-9 lg:flex lg:flex-col xl:px-14">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl border border-accent-primary bg-accent-primary shadow-[0_0_24px_var(--accent-primary-dim)]" />
          <span className="text-base font-semibold tracking-normal text-text-primary">
            SYSDES
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-normal text-text-primary">
            Design systems at the speed of thought.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-text-muted">
            Describe your architecture in plain English. SYSDES maps it to a
            shared canvas your whole team can refine in real time.
          </p>

          <ul className="mt-16 space-y-9">
            {featureList.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-accent-primary/40 bg-accent-primary-dim text-accent-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold tracking-normal text-text-secondary">
                    {title}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-text-muted">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-text-faint">
          &copy; 2026 SYSDES. All rights reserved.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-bg-base px-4 py-8 lg:min-h-screen">
        <div className="w-full max-w-[34rem]">{children}</div>
      </section>
    </main>
  );
}
