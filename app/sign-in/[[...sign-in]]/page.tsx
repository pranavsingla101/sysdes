import { SignIn } from "@clerk/nextjs";
import { AuthPanel } from "@/components/auth/auth-panel";

// Strip Clerk's own card chrome so the AuthPanel glass card provides all visual structure.
const transparentCard = {
  elements: {
    rootBox: "!mx-auto !w-full !max-w-[334px]",
    cardBox: "!bg-transparent !shadow-none !border-0 !rounded-none !p-0 !w-full !max-w-none !overflow-visible",
    card: "!bg-transparent !shadow-none !border-0 !p-0 !m-0 !w-full !max-w-none",
    header: "!hidden",
    main: "!mx-auto !w-full",
    form: "!mx-auto !w-full",
    formFields: "!mx-auto !w-full",
    formFieldRow: "!mx-auto !w-full",
    formField: "!mx-auto !w-full",
    formFieldInputShowPasswordButton: "text-text-muted hover:text-text-primary",
    footer: "!mx-auto !w-full !bg-transparent !border-0 !pt-2",
    // Social OAuth buttons: full-width flex rows with explicit visible colors.
    socialButtonsRoot: "!w-full",
    socialButtons: "!w-full !flex !flex-col !gap-2",
    socialButtonsBlockButton:
      "!relative !w-full !h-11 !min-h-11 !flex !flex-row !items-center !justify-center !gap-2.5 !px-4 !bg-bg-elevated !border !border-border-default !text-text-secondary hover:!bg-bg-subtle hover:!text-text-primary !rounded-lg !transition-colors !shadow-none",
    socialButtonsProviderIcon: "!h-5 !w-5 !shrink-0",
    socialButtonsBlockButtonText:
      "!text-sm !font-medium !text-text-secondary",
    // Hide "Last used" / "Default" badges.
    badge: "!hidden",
    lastAuthenticationStrategyBadge: "!hidden",
  },
};

export default function SignInPage() {
  return (
    <AuthPanel heading="Welcome back" subheading="Sign in to SYSDES">
      <SignIn appearance={transparentCard} />
    </AuthPanel>
  );
}
