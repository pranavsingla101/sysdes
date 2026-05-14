import { getCurrentProjectIdentity, getProjectByAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/project-api";

export async function GET(
  _request: Request,
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

  const specs = await prisma.projectSpec.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: { id: true, filePath: true, createdAt: true },
  });

  return Response.json({
    specs: specs.map((s) => ({
      id: s.id,
      filename: s.filePath.split("/").pop() ?? s.id,
      createdAt: s.createdAt.toISOString(),
    })),
  });
}
