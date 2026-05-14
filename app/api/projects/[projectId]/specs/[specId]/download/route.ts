import { get } from "@vercel/blob";
import { getCurrentProjectIdentity, getProjectByAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/project-api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; specId: string }> }
) {
  const { projectId, specId } = await params;

  const identity = await getCurrentProjectIdentity();
  if (!identity) {
    return errorResponse("Unauthorized", 401);
  }

  const project = await getProjectByAccess(projectId, identity);
  if (!project) {
    return errorResponse("Project not found or access denied", 404);
  }

  const spec = await prisma.projectSpec.findFirst({
    where: { id: specId, projectId },
  });

  if (!spec) {
    return errorResponse("Spec not found", 404);
  }

  let content: string;
  try {
    const result = await get(spec.filePath, { access: "private" });
    if (!result) throw new Error("Blob not found");
    content = await new Response(result.stream).text();
  } catch {
    return errorResponse("Failed to fetch spec file", 500);
  }

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="spec-${specId}.md"`,
    },
  });
}
