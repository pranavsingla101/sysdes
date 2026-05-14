import { put, get } from "@vercel/blob";
import { getCurrentProjectIdentity, getProjectByAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/project-api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const identity = await getCurrentProjectIdentity();

  if (!identity) {
    return errorResponse("Unauthorized", 401);
  }

  const project = await getProjectByAccess(projectId, identity);

  if (!project) {
    return errorResponse("Project not found or access denied", 404);
  }

  if (!project.canvasBlobUrl) {
    return Response.json({ nodes: [], edges: [] });
  }

  try {
    const result = await get(project.canvasBlobUrl, { access: "private" });
    if (!result) throw new Error("Blob not found");
    const canvasData = await new Response(result.stream).json();
    return Response.json(canvasData);
  } catch (error) {
    console.error("Error fetching canvas from blob:", error);
    return errorResponse("Failed to load canvas state", 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const identity = await getCurrentProjectIdentity();

  if (!identity) {
    return errorResponse("Unauthorized", 401);
  }

  const project = await getProjectByAccess(projectId, identity);

  if (!project) {
    return errorResponse("Project not found or access denied", 404);
  }

  const body = await request.json();

  if (!body || typeof body !== "object") {
    return errorResponse("Invalid canvas data", 400);
  }

  try {
    const blob = await put(`projects/${projectId}/canvas.json`, JSON.stringify(body), {
      access: "private",
      contentType: "application/json",
      allowOverwrite: true,
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { canvasBlobUrl: blob.url },
    });

    return Response.json({ url: blob.url });
  } catch (error) {
    console.error("Error saving canvas to blob:", error);
    return errorResponse("Failed to save canvas state", 500);
  }
}
