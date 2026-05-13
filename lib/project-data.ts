import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId, serializeProject } from "@/lib/project-api";

export async function getEditorProjects() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return {
      ownedProjects: [],
      sharedProjects: [],
    };
  }

  const user = await currentUser();
  const emailAddresses = user?.emailAddresses.map((email) =>
    email.emailAddress.toLowerCase()
  ) ?? [];

  const [ownedProjects, sharedProjects] = await Promise.all([
    prisma.project.findMany({
      where: {
        ownerId: userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    emailAddresses.length === 0
      ? Promise.resolve([])
      : prisma.project.findMany({
          where: {
            ownerId: {
              not: userId,
            },
            collaborators: {
              some: {
                email: {
                  in: emailAddresses,
                },
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        }),
  ]);

  return {
    ownedProjects: ownedProjects.map(serializeProject),
    sharedProjects: sharedProjects.map(serializeProject),
  };
}

export async function getAccessibleProject(projectId: string) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return null;
  }

  const user = await currentUser();
  const emailAddresses = user?.emailAddresses.map((email) =>
    email.emailAddress.toLowerCase()
  ) ?? [];

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        {
          ownerId: userId,
        },
        {
          collaborators: {
            some: {
              email: {
                in: emailAddresses,
              },
            },
          },
        },
      ],
    },
  });

  return project ? serializeProject(project) : null;
}
