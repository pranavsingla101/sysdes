import { Bot, FileText, Network } from "lucide-react";

interface AuthPanelProps {
  children: React.ReactNode;
  heading?: string;
  subheading?: string;
}

const featureList = [
  {
    icon: Bot,
    title: "AI Architecture Generation",
    description: "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Network,
    title: "Real-time Collaboration",
    description: "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileText,
    title: "Instant Spec Generation",
    description: "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

// Graph nodes in viewBox 0-100 coordinate space
const NODES = [
  { cx: 14, cy: 30, r: 0.9, delay: "0s" },
  { cx: 37, cy: 17, r: 0.7, delay: "0.4s" },
  { cx: 61, cy: 37, r: 1.1, delay: "0.8s" },
  { cx: 28, cy: 55, r: 0.9, delay: "0.2s" },
  { cx: 74, cy: 22, r: 0.6, delay: "0.6s" },
  { cx: 9, cy: 65, r: 0.7, delay: "1s" },
  { cx: 52, cy: 70, r: 0.9, delay: "0.3s" },
  { cx: 83, cy: 53, r: 0.6, delay: "0.7s" },
  { cx: 22, cy: 81, r: 0.7, delay: "0.5s" },
  { cx: 67, cy: 83, r: 0.9, delay: "0.9s" },
];

const EDGES: [number, number][] = [
  [0, 1], [1, 2], [1, 3], [2, 4], [0, 3],
  [0, 5], [3, 6], [2, 7], [5, 8], [6, 9], [7, 9],
];

// Pre-seeded particle positions for SSR safety
const PARTICLES = [
  { x: 8,  y: 15, delay: "0s"   },
  { x: 91, y: 9,  delay: "0.5s" },
  { x: 23, y: 77, delay: "1s"   },
  { x: 67, y: 35, delay: "1.5s" },
  { x: 45, y: 91, delay: "0.8s" },
  { x: 78, y: 55, delay: "2s"   },
  { x: 15, y: 47, delay: "0.3s" },
  { x: 88, y: 72, delay: "1.8s" },
  { x: 34, y: 23, delay: "0.6s" },
  { x: 56, y: 68, delay: "1.2s" },
  { x: 72, y: 14, delay: "2.5s" },
  { x: 5,  y: 85, delay: "0.9s" },
];

export function AuthPanel({
  children,
  heading = "Welcome back",
  subheading = "Sign in to continue to SYSDES",
}: AuthPanelProps) {
  return (
    <main
      className="min-h-screen font-sans text-text-primary lg:grid lg:grid-cols-[55%_45%]"
      style={{ background: "linear-gradient(135deg, #050816 0%, #0a1020 100%)" }}
    >
      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <section className="relative hidden min-h-screen overflow-hidden lg:flex lg:flex-col">

        {/* Blueprint grid overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: [
              "linear-gradient(rgba(0,200,212,0.05) 1px, transparent 1px)",
              "linear-gradient(90deg, rgba(0,200,212,0.05) 1px, transparent 1px)",
            ].join(", "),
            backgroundSize: "48px 48px",
          }}
        />

        {/* Volumetric glow sphere */}
        <div
          className="pointer-events-none absolute left-[32%] top-[42%] h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(0,140,255,0.055) 0%, transparent 65%)",
          }}
        />

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="pointer-events-none absolute h-[3px] w-[3px] rounded-full bg-accent-primary"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              opacity: 0.35,
              animation: `auth-particle ${2.5 + (i % 3) * 0.7}s ease-in-out ${p.delay} infinite alternate`,
            }}
          />
        ))}

        {/* SVG graph visualization */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.28]"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <filter id="auth-node-glow">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {EDGES.map(([a, b], i) => (
            <line
              key={i}
              x1={NODES[a].cx}
              y1={NODES[a].cy}
              x2={NODES[b].cx}
              y2={NODES[b].cy}
              stroke="rgba(0,200,212,0.32)"
              strokeWidth="0.25"
            />
          ))}

          {/* Nodes */}
          {NODES.map((n, i) => (
            <g key={i}>
              {/* Outer glow ring */}
              <circle
                cx={n.cx}
                cy={n.cy}
                r={n.r * 2.8}
                fill="none"
                stroke="rgba(0,200,212,0.12)"
                strokeWidth="0.3"
              />
              {/* Inner filled dot */}
              <circle
                cx={n.cx}
                cy={n.cy}
                r={n.r}
                fill="rgba(0,200,212,0.7)"
                filter="url(#auth-node-glow)"
                style={{
                  animation: `auth-node-pulse 2.5s ease-in-out ${n.delay} infinite alternate`,
                }}
              />
            </g>
          ))}
        </svg>

        {/* Main content */}
        <div className="relative z-10 flex flex-1 flex-col justify-between px-14 py-10 xl:px-16">

          {/* Brand mark */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent-primary/30"
              style={{
                background: "rgba(0,200,212,0.1)",
                boxShadow: "0 0 16px rgba(0,200,212,0.2), inset 0 1px 0 rgba(0,200,212,0.14)",
              }}
            >
              <div className="h-3 w-3 rounded-sm bg-accent-primary" />
            </div>
            <span className="text-sm font-semibold tracking-[0.15em] text-text-primary">
              SYSDES
            </span>
          </div>

          {/* Hero + features */}
          <div className="space-y-10">
            <div className="space-y-5">
              <h1 className="max-w-xl text-5xl font-bold leading-[1.1] tracking-tight text-text-primary xl:text-[3.5rem]">
                Design systems at the speed of{" "}
                <span
                  style={{
                    backgroundImage: "linear-gradient(90deg, #00d9ff, #008cff)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter: "drop-shadow(0 0 16px rgba(0,217,255,0.45))",
                  }}
                >
                  thought.
                </span>
              </h1>
              <p className="max-w-md text-base leading-7 text-text-muted">
                Describe your architecture in plain English. SYSDES maps it to a
                shared canvas your whole team can refine in real time.
              </p>
            </div>

            <ul className="space-y-7">
              {featureList.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex items-start gap-4">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent-primary/20"
                    style={{
                      background: "rgba(0,200,212,0.07)",
                      boxShadow: "0 0 10px rgba(0,200,212,0.1)",
                    }}
                  >
                    <Icon className="h-4 w-4 text-accent-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-text-secondary">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-text-muted">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer: logo badge + copyright */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent-primary/20"
              style={{ background: "rgba(0,200,212,0.06)" }}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-accent-primary/45" />
            </div>
            <p className="text-xs text-text-faint">&copy; 2026 SYSDES. All rights reserved.</p>
          </div>
        </div>
      </section>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <section
        className="relative flex min-h-screen items-center justify-center px-5 py-12"
        style={{ background: "linear-gradient(155deg, #07101e 0%, #050816 100%)" }}
      >
        {/* Radial glow behind the card */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div
            className="h-[500px] w-[500px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(0,140,255,0.1) 0%, transparent 65%)",
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-[420px] pt-3">
          {/* Glassmorphism card */}
          <div
            className="rounded-[28px] px-8 pb-6 pt-8"
            style={{
              background: "rgba(7, 12, 24, 0.82)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(0,200,212,0.22)",
              boxShadow: [
                "0 0 0 1px rgba(0,200,212,0.07)",
                "0 24px 64px rgba(0,0,0,0.6)",
                "0 0 32px rgba(0,200,212,0.14)",
                "0 0 64px rgba(0,200,212,0.07)",
                "inset 0 1px 0 rgba(0,200,212,0.12)",
              ].join(", "),
            }}
          >
            {/* Custom heading (replaces Clerk's default header) */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-text-primary">{heading}</h2>
              <p className="mt-1.5 text-sm text-text-muted">{subheading}</p>
            </div>

            {/* Clerk component – card styled transparent via appearance prop */}
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
