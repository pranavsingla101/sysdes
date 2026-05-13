import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import type { ProjectCollaborator } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { CurrentProjectIdentity } from "@/lib/project-access";

export interface SerializedCollaborator {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface CollaboratorRequestBody {
  email?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function getProjectAccessRole(
  projectId: string,
  identity: CurrentProjectIdentity
): Promise<"owner" | "collaborator" | null> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        {
          ownerId: identity.userId,
        },
        ...(identity.primaryEmail
          ? [
              {
                collaborators: {
                  some: {
                    email: identity.primaryEmail,
                  },
                },
              },
            ]
          : []),
      ],
    },
    select: {
      ownerId: true,
    },
  });

  if (!project) {
    return null;
  }

  return project.ownerId === identity.userId ? "owner" : "collaborator";
}

export async function serializeCollaborators(
  collaborators: ProjectCollaborator[]
): Promise<SerializedCollaborator[]> {
  const emails = collaborators.map((collaborator) => collaborator.email);
  const usersByEmail = new Map<
    string,
    { displayName: string | null; avatarUrl: string | null }
  >();

  if (emails.length > 0) {
    const client = await clerkClient();
    const users = await client.users.getUserList({
      emailAddress: emails,
      limit: emails.length,
    });

    for (const user of users.data) {
      for (const emailAddress of user.emailAddresses) {
        const email = emailAddress.emailAddress.toLowerCase();

        if (emails.includes(email)) {
          usersByEmail.set(email, {
            displayName: user.fullName,
            avatarUrl: user.imageUrl,
          });
        }
      }
    }
  }

  return collaborators.map((collaborator) => {
    const user = usersByEmail.get(collaborator.email) ?? null;

    return {
      id: collaborator.id,
      email: collaborator.email,
      displayName: user?.displayName ?? null,
      avatarUrl: user?.avatarUrl ?? null,
      createdAt: collaborator.createdAt.toISOString(),
    };
  });
}

export async function readCollaboratorRequestBody(
  request: Request
): Promise<CollaboratorRequestBody | Response> {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return {};
  }

  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return Response.json(
      { error: { message: "Request body must be valid JSON." } },
      { status: 400 }
    );
  }

  if (
    typeof parsedBody !== "object" ||
    parsedBody === null ||
    Array.isArray(parsedBody)
  ) {
    return Response.json(
      { error: { message: "Request body must be a JSON object." } },
      { status: 400 }
    );
  }

  const body = parsedBody as Record<string, unknown>;

  if (body.email !== undefined && typeof body.email !== "string") {
    return Response.json(
      { error: { message: "Email must be a string." } },
      { status: 400 }
    );
  }

  return {
    email: body.email,
  };
}

export function parseCollaboratorEmail(
  email: string | undefined
): string | Response {
  const parsedEmail = email?.trim().toLowerCase();

  if (!parsedEmail || !EMAIL_PATTERN.test(parsedEmail)) {
    return Response.json(
      { error: { message: "A valid email address is required." } },
      { status: 400 }
    );
  }

  return parsedEmail;
}
