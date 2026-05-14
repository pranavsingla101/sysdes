import { tasks } from "@trigger.dev/sdk";
import type { designAgent } from "@/trigger/design-agent";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/project-api";
import {
  getCurrentProjectIdentity,
  getProjectByAccess,
} from "@/lib/project-access";

interface DesignRequestBody {
  prompt: string;
  roomId: string;
  projectId: string;
}

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity();

  if (!identity) {
    return errorResponse("Unauthorized", 401);
  }

  const body = await readDesignRequestBody(request);

  if (body instanceof Response) {
    return body;
  }

  const project = await getProjectByAccess(body.projectId, identity);

  if (!project) {
    return errorResponse("Forbidden", 403);
  }

  const handle = await tasks.trigger<typeof designAgent>("design-agent", {
    prompt: body.prompt,
    roomId: body.roomId,
  });

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId: body.projectId,
      userId: identity.userId,
    },
  });

  return Response.json({ runId: handle.id }, { status: 201 });
}

async function readDesignRequestBody(
  request: Request
): Promise<DesignRequestBody | Response> {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return errorResponse("Request body is required.", 400);
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

  if (typeof body.prompt !== "string" || !body.prompt.trim()) {
    return errorResponse("prompt is required.", 400);
  }

  if (typeof body.roomId !== "string" || !body.roomId.trim()) {
    return errorResponse("roomId is required.", 400);
  }

  if (typeof body.projectId !== "string" || !body.projectId.trim()) {
    return errorResponse("projectId is required.", 400);
  }

  return {
    prompt: body.prompt.trim(),
    roomId: body.roomId.trim(),
    projectId: body.projectId.trim(),
  };
}
