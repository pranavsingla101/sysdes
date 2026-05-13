import { prisma } from "@/lib/prisma";
import {
  errorResponse,
  getAuthenticatedUserId,
  parseOptionalProjectId,
  projectNameOrDefault,
  readProjectRequestBody,
  serializeProject,
} from "@/lib/project-api";

export async function GET() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return errorResponse("Unauthorized", 401);
  }

  const projects = await prisma.project.findMany({
    where: {
      ownerId: userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return Response.json({
    projects: projects.map(serializeProject),
  });
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return errorResponse("Unauthorized", 401);
  }

  const body = await readProjectRequestBody(request);

  if (body instanceof Response) {
    return body;
  }

  const projectId = parseOptionalProjectId(body.id);

  if (projectId instanceof Response) {
    return projectId;
  }

  if (projectId) {
    const existingProject = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (existingProject) {
      return errorResponse("Project ID already exists.", 409);
    }
  }

  const project = await prisma.project.create({
    data: {
      id: projectId,
      ownerId: userId,
      name: projectNameOrDefault(body.name),
    },
  });

  return Response.json({ project: serializeProject(project) }, { status: 201 });
}
