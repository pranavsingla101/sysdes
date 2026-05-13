import { auth } from "@clerk/nextjs/server";
import type { Project } from "@/app/generated/prisma/client";

export interface SerializedProject {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  status: Project["status"];
  canvasJsonPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRequestBody {
  id?: string;
  name?: string;
}

export function serializeProject(project: Project): SerializedProject {
  return {
    id: project.id,
    ownerId: project.ownerId,
    name: project.name,
    description: project.description,
    status: project.status,
    canvasJsonPath: project.canvasJsonPath,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return null;
  }

  return userId;
}

export function errorResponse(message: string, status: number): Response {
  return Response.json({ error: { message } }, { status });
}

export async function readProjectRequestBody(
  request: Request
): Promise<ProjectRequestBody | Response> {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return {};
  }

  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  if (
    typeof parsedBody !== "object" ||
    parsedBody === null ||
    Array.isArray(parsedBody)
  ) {
    return errorResponse("Request body must be a JSON object.", 400);
  }

  const body = parsedBody as Record<string, unknown>;

  if (body.id !== undefined && typeof body.id !== "string") {
    return errorResponse("Project ID must be a string.", 400);
  }

  if (body.name !== undefined && typeof body.name !== "string") {
    return errorResponse("Project name must be a string.", 400);
  }

  return {
    id: body.id,
    name: body.name,
  };
}

export function parseOptionalProjectId(
  id: string | undefined
): string | undefined | Response {
  if (id === undefined) {
    return undefined;
  }

  const parsedId = id.trim();

  if (!/^[a-z0-9](?:[a-z0-9-]{1,78}[a-z0-9])?$/.test(parsedId)) {
    return errorResponse(
      "Project ID must be 3-80 lowercase letters, numbers, or hyphens.",
      400
    );
  }

  return parsedId;
}

export function projectNameOrDefault(name: string | undefined): string {
  return name?.trim() || "Untitled Project";
}

export function parseRequiredProjectName(
  name: string | undefined
): string | Response {
  const parsedName = name?.trim();

  if (!parsedName) {
    return errorResponse("Project name is required.", 400);
  }

  return parsedName;
}
