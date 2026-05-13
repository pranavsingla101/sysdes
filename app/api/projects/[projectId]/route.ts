import { prisma } from "@/lib/prisma";
import {
  errorResponse,
  getAuthenticatedUserId,
  parseRequiredProjectName,
  readProjectRequestBody,
  serializeProject,
} from "@/lib/project-api";

interface ProjectRouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

export async function PATCH(
  request: Request,
  { params }: ProjectRouteContext
) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return errorResponse("Unauthorized", 401);
  }

  const { projectId } = await params;
  const existingProject = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!existingProject) {
    return errorResponse("Project not found.", 404);
  }

  if (existingProject.ownerId !== userId) {
    return errorResponse("Forbidden", 403);
  }

  const body = await readProjectRequestBody(request);

  if (body instanceof Response) {
    return body;
  }

  const name = parseRequiredProjectName(body.name);

  if (name instanceof Response) {
    return name;
  }

  const project = await prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      name,
    },
  });

  return Response.json({ project: serializeProject(project) });
}

export async function DELETE(
  _request: Request,
  { params }: ProjectRouteContext
) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return errorResponse("Unauthorized", 401);
  }

  const { projectId } = await params;
  const existingProject = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!existingProject) {
    return errorResponse("Project not found.", 404);
  }

  if (existingProject.ownerId !== userId) {
    return errorResponse("Forbidden", 403);
  }

  await prisma.project.delete({
    where: {
      id: projectId,
    },
  });

  return Response.json({ project: serializeProject(existingProject) });
}
