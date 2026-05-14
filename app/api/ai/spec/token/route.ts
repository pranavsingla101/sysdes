import { auth } from "@trigger.dev/sdk";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/project-api";
import { getCurrentProjectIdentity } from "@/lib/project-access";

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity();

  if (!identity) {
    return errorResponse("Unauthorized", 401);
  }

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

  if (typeof body.runId !== "string" || !body.runId.trim()) {
    return errorResponse("runId is required.", 400);
  }

  const runId = body.runId.trim();

  const taskRun = await prisma.taskRun.findUnique({
    where: { runId },
  });

  if (!taskRun || taskRun.userId !== identity.userId) {
    return errorResponse("Forbidden", 403);
  }

  const token = await auth.createPublicToken({
    scopes: {
      read: {
        runs: [runId],
      },
    },
    expirationTime: "1h",
  });

  return Response.json({ token });
}
