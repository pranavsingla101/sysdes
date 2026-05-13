"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Mail, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ShareDialogProps {
  isOpen: boolean;
  isOwner: boolean;
  projectId: string | null;
  projectName: string | null;
  onOpenChange: (open: boolean) => void;
}

interface Collaborator {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

interface CollaboratorsResponse {
  role: "owner" | "collaborator";
  collaborators: Collaborator[];
}

interface CollaboratorResponse {
  collaborator: Collaborator;
}

interface ErrorResponse {
  error?: {
    message?: string;
  };
}

function getErrorMessage(body: unknown, fallback: string) {
  const parsedBody = body as ErrorResponse;

  return parsedBody.error?.message ?? fallback;
}

export function ShareDialog({
  isOpen,
  isOwner,
  projectId,
  projectName,
  onOpenChange,
}: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const projectLink = useMemo(() => {
    if (!projectId || typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/editor/${projectId}`;
  }, [projectId]);

  useEffect(() => {
    if (!isOpen || !projectId) {
      return;
    }

    let isCurrent = true;

    async function loadCollaborators() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(
          `/api/projects/${projectId}/collaborators`
        );
        const body = (await response.json()) as CollaboratorsResponse &
          ErrorResponse;

        if (!response.ok) {
          throw new Error(
            getErrorMessage(body, "Could not load collaborators.")
          );
        }

        if (isCurrent) {
          setCollaborators(body.collaborators);
        }
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not load collaborators."
          );
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadCollaborators();

    return () => {
      isCurrent = false;
    };
  }, [isOpen, projectId]);

  useEffect(() => {
    if (copyState !== "copied") {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopyState("idle"), 1600);

    return () => window.clearTimeout(timeoutId);
  }, [copyState]);

  async function inviteCollaborator(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!projectId) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const body = (await response.json()) as CollaboratorResponse &
        ErrorResponse;

      if (!response.ok) {
        throw new Error(getErrorMessage(body, "Could not invite collaborator."));
      }

      setCollaborators((current) => {
        const next = current.filter(
          (collaborator) => collaborator.email !== body.collaborator.email
        );

        return [...next, body.collaborator];
      });
      setEmail("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not invite collaborator."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeCollaborator(collaboratorEmail: string) {
    if (!projectId) {
      return;
    }

    setRemovingEmail(collaboratorEmail);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: collaboratorEmail }),
      });
      const body = (await response.json()) as ErrorResponse;

      if (!response.ok) {
        throw new Error(getErrorMessage(body, "Could not remove collaborator."));
      }

      setCollaborators((current) =>
        current.filter((collaborator) => collaborator.email !== collaboratorEmail)
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not remove collaborator."
      );
    } finally {
      setRemovingEmail(null);
    }
  }

  async function copyProjectLink() {
    if (!projectLink) {
      return;
    }

    await navigator.clipboard.writeText(projectLink);
    setCopyState("copied");
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border border-border-default bg-bg-elevated p-0 text-text-primary sm:max-w-lg">
        <div className="grid gap-5 p-6">
          <DialogHeader>
            <DialogTitle>Share {projectName ?? "Project"}</DialogTitle>
            <DialogDescription>
              {isOwner
                ? "Invite collaborators by email or copy the project link."
                : "View everyone with access to this project."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-text-secondary">
              Project link
            </label>
            <div className="flex min-w-0 gap-2">
              <Input
                value={projectLink}
                readOnly
                className="border-border-default bg-bg-surface font-mono text-xs text-text-muted"
              />
              <Button
                type="button"
                variant="outline"
                onClick={copyProjectLink}
                className="h-8 gap-2 border-border-default bg-bg-surface text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
              >
                {copyState === "copied" ? (
                  <>
                    <Check className="h-4 w-4 text-state-success" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {isOwner && (
            <form className="grid gap-2" onSubmit={inviteCollaborator}>
              <label className="text-sm font-medium text-text-secondary">
                Invite by email
              </label>
              <div className="flex min-w-0 gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="teammate@example.com"
                  className="border-border-default bg-bg-surface text-text-primary placeholder:text-text-muted"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-8 gap-2 bg-accent-primary text-bg-base hover:bg-accent-primary/90"
                >
                  <Mail className="h-4 w-4" />
                  Invite
                </Button>
              </div>
            </form>
          )}

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">
                Collaborators
              </h3>
              <span className="text-xs font-medium text-text-faint">
                {collaborators.length}
              </span>
            </div>
            <div className="max-h-72 overflow-y-auto rounded-2xl border border-border-default bg-bg-surface">
              {isLoading ? (
                <p className="px-4 py-5 text-sm text-text-muted">
                  Loading collaborators...
                </p>
              ) : collaborators.length === 0 ? (
                <p className="px-4 py-5 text-sm text-text-muted">
                  No collaborators yet.
                </p>
              ) : (
                <div className="divide-y divide-border-default">
                  {collaborators.map((collaborator) => (
                    <div
                      key={collaborator.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-default bg-bg-elevated text-text-muted">
                        {collaborator.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={collaborator.avatarUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserRound className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text-primary">
                          {collaborator.displayName ?? collaborator.email}
                        </p>
                        {collaborator.displayName && (
                          <p className="truncate text-xs font-medium text-text-muted">
                            {collaborator.email}
                          </p>
                        )}
                      </div>
                      {isOwner && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={removingEmail === collaborator.email}
                          onClick={() => removeCollaborator(collaborator.email)}
                          className="h-8 w-8 text-text-muted hover:bg-bg-elevated hover:text-state-error"
                          aria-label={`Remove ${collaborator.email}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {errorMessage && (
            <p className="rounded-xl border border-state-error/30 bg-bg-surface px-3 py-2 text-sm text-state-error">
              {errorMessage}
            </p>
          )}
        </div>
        <DialogFooter className="border-border-default bg-bg-surface px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
