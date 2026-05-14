import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { serializeProject, type SerializedProject } from "@/lib/project-api";

export interface CurrentProjectIdentity {
  userId: string;
  primaryEmail: string | null;
  displayName: string;
  avatarUrl: string;
}

export async function getCurrentProjectIdentity(): Promise<CurrentProjectIdentity | null> {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return null;
  }

  const user = await currentUser();

  return {
    userId,
    primaryEmail: user?.primaryEmailAddress?.emailAddress.toLowerCase() ?? null,
    displayName: user?.fullName ?? user?.username ?? user?.primaryEmailAddress?.emailAddress ?? "Collaborator",
    avatarUrl: user?.imageUrl ?? "",
  };
}

export async function getProjectByAccess(
  roomId: string,
  identity: CurrentProjectIdentity
): Promise<SerializedProject | null> {
  const project = await prisma.project.findFirst({
    where: {
      id: roomId,
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
  });

  return project ? serializeProject(project) : null;
}
