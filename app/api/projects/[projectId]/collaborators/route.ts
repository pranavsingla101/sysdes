import { prisma } from "@/lib/prisma";
import {
  getCurrentProjectIdentity,
} from "@/lib/project-access";
import {
  getProjectAccessRole,
  parseCollaboratorEmail,
  readCollaboratorRequestBody,
  serializeCollaborators,
} from "@/lib/project-collaborators";
import { errorResponse } from "@/lib/project-api";

interface ProjectCollaboratorsRouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: ProjectCollaboratorsRouteContext
) {
  const identity = await getCurrentProjectIdentity();

  if (!identity) {
    return errorResponse("Unauthorized", 401);
  }

  const { projectId } = await params;
  const role = await getProjectAccessRole(projectId, identity);

  if (!role) {
    return errorResponse("Project not found.", 404);
  }

  const collaborators = await prisma.projectCollaborator.findMany({
    where: {
      projectId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return Response.json({
    role,
    collaborators: await serializeCollaborators(collaborators),
  });
}

export async function POST(
  request: Request,
  { params }: ProjectCollaboratorsRouteContext
) {
  const identity = await getCurrentProjectIdentity();

  if (!identity) {
    return errorResponse("Unauthorized", 401);
  }

  const { projectId } = await params;
  const role = await getProjectAccessRole(projectId, identity);

  if (!role) {
    return errorResponse("Project not found.", 404);
  }

  if (role !== "owner") {
    return errorResponse("Forbidden", 403);
  }

  const body = await readCollaboratorRequestBody(request);

  if (body instanceof Response) {
    return body;
  }

  const email = parseCollaboratorEmail(body.email);

  if (email instanceof Response) {
    return email;
  }

  if (email === identity.primaryEmail) {
    return errorResponse("Owners cannot invite themselves.", 400);
  }

  const collaborator = await prisma.projectCollaborator.upsert({
    where: {
      projectId_email: {
        projectId,
        email,
      },
    },
    update: {},
    create: {
      projectId,
      email,
    },
  });

  const collaborators = await serializeCollaborators([collaborator]);

  return Response.json(
    {
      collaborator: collaborators[0],
    },
    { status: 201 }
  );
}

export async function DELETE(
  request: Request,
  { params }: ProjectCollaboratorsRouteContext
) {
  const identity = await getCurrentProjectIdentity();

  if (!identity) {
    return errorResponse("Unauthorized", 401);
  }

  const { projectId } = await params;
  const role = await getProjectAccessRole(projectId, identity);

  if (!role) {
    return errorResponse("Project not found.", 404);
  }

  if (role !== "owner") {
    return errorResponse("Forbidden", 403);
  }

  const body = await readCollaboratorRequestBody(request);

  if (body instanceof Response) {
    return body;
  }

  const email = parseCollaboratorEmail(body.email);

  if (email instanceof Response) {
    return email;
  }

  await prisma.projectCollaborator.deleteMany({
    where: {
      projectId,
      email,
    },
  });

  return Response.json({
    removedEmail: email,
  });
}
