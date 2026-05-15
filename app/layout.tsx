import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import { Geist, Geist_Mono } from "next/font/google";
import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "sysdes",
  description: "Collaborative system design workspace",
};

const clerkAppearance = {
  theme: dark,
  variables: {
    colorBackground: "var(--bg-surface)",
    colorBorder: "var(--border-default)",
    colorForeground: "var(--text-primary)",
    colorInput: "var(--bg-subtle)",
    colorInputForeground: "var(--text-primary)",
    colorMuted: "var(--bg-elevated)",
    colorMutedForeground: "var(--text-muted)",
    colorPrimary: "var(--accent-primary)",
    colorPrimaryForeground: "var(--bg-base)",
    colorDanger: "var(--state-error)",
    colorRing: "var(--accent-primary)",
    borderRadius: "var(--radius)",
    fontFamily: "var(--font-geist-sans)",
    fontFamilyButtons: "var(--font-geist-sans)",
  },
  elements: {
    rootBox: "font-sans",
    cardBox: "bg-bg-surface border border-border-default shadow-none rounded-3xl overflow-hidden",
    card: "bg-bg-surface shadow-none border-0 px-8 py-8 sm:px-10",
    headerTitle: "text-text-primary font-semibold tracking-normal",
    headerSubtitle: "text-text-muted",
    badge: "!hidden",
    socialButtonsBlock: "w-full flex flex-col gap-2",
    socialButtonsBlockButton:
      "w-full bg-bg-elevated border border-border-default text-text-secondary hover:bg-bg-subtle hover:text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
    dividerLine: "bg-border-default",
    dividerText: "text-text-muted text-xs",
    formFieldLabel: "text-text-primary font-medium",
    formFieldInput:
      "w-full bg-bg-subtle border-border-default text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:ring-1 focus:ring-accent-primary",
    formButtonPrimary:
      "bg-accent-primary text-bg-base font-semibold shadow-[0_0_20px_rgba(0,200,212,0.3)] hover:shadow-[0_0_28px_rgba(0,200,212,0.45)] transition-shadow",
    footer: "bg-transparent border-t border-border-default/50",
    footerActionText: "text-text-muted",
    footerActionLink: "text-accent-primary hover:text-accent-primary",
    identityPreviewText: "text-text-primary",
    identityPreviewEditButton: "text-accent-primary",
    userButtonPopoverCard:
      "bg-bg-surface border border-border-default text-text-primary shadow-2xl shadow-bg-base/70",
    userButtonPopoverActionButton:
      "text-text-secondary hover:bg-bg-elevated hover:text-text-primary focus:bg-bg-elevated focus:text-text-primary",
    userButtonPopoverActionButtonIcon:
      "text-text-muted group-hover:text-text-primary group-focus:text-text-primary",
    userButtonPopoverActionButtonText:
      "text-text-secondary group-hover:text-text-primary group-focus:text-text-primary",
    userButtonPopoverFooter: "bg-bg-surface border-t border-border-default/50",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={clerkAppearance}
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full bg-bg-base text-text-primary">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
