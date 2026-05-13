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
    socialButtonsBlockButton:
      "bg-bg-surface border-border-default text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
    dividerLine: "bg-border-default",
    dividerText: "text-text-muted",
    formFieldLabel: "text-text-primary font-medium",
    formFieldInput:
      "bg-bg-subtle border-border-default text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:ring-accent-primary",
    formButtonPrimary:
      "bg-accent-primary text-bg-base font-semibold hover:bg-accent-primary",
    footer: "bg-bg-elevated border-t border-border-default",
    footerActionText: "text-text-secondary",
    footerActionLink: "text-accent-primary hover:text-accent-primary",
    identityPreviewText: "text-text-primary",
    identityPreviewEditButton: "text-accent-primary",
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
