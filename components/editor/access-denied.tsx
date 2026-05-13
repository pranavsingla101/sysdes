import { Lock } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AccessDenied() {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border-default bg-bg-elevated text-text-secondary">
          <Lock className="h-5 w-5" />
        </div>
        <div className="grid gap-2">
          <h1 className="text-xl font-semibold text-text-primary">
            Access denied
          </h1>
          <p className="text-sm leading-6 text-text-secondary">
            This project does not exist or you do not have access to it.
          </p>
        </div>
        <Link
          href="/editor"
          className={cn(
            buttonVariants(),
            "bg-accent-primary text-bg-base hover:bg-accent-primary/90"
          )}
        >
          Back to editor
        </Link>
      </div>
    </div>
  );
}
