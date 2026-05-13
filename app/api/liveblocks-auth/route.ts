import { currentUser } from "@clerk/nextjs/server";
import { cursorColorForUser, getLiveblocksClient } from "@/lib/liveblocks";
import { errorResponse } from "@/lib/project-api";
import {
  getCurrentProjectIdentity,
  getProjectByAccess,
} from "@/lib/project-access";

interface LiveblocksAuthRequestBody {
  room?: string;
}

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity();

  if (!identity) {
    return errorResponse("Unauthorized", 401);
  }

  const body = await readLiveblocksAuthRequestBody(request);

  if (body instanceof Response) {
    return body;
  }

  const roomId = parseRoomId(body.room);

  if (roomId instanceof Response) {
    return roomId;
  }

  const project = await getProjectByAccess(roomId, identity);

  if (!project) {
    return errorResponse("Forbidden", 403);
  }

  const user = await currentUser();
  const displayName =
    user?.fullName ??
    user?.username ??
    identity.primaryEmail ??
    "Collaborator";
  const avatarUrl = user?.imageUrl ?? "";
  const cursorColor = cursorColorForUser(identity.userId);
  const liveblocks = getLiveblocksClient();

  await liveblocks.getOrCreateRoom(roomId, {
    defaultAccesses: ["room:write"],
    metadata: {
      projectId: project.id,
      projectName: project.name,
    },
  });

  const { status, body: responseBody } = await liveblocks.identifyUser(
    {
      userId: identity.userId,
      groupIds: [],
    },
    {
      userInfo: {
        displayName,
        avatarUrl,
        cursorColor,
      },
    }
  );

  return new Response(responseBody, { status });
}

async function readLiveblocksAuthRequestBody(
  request: Request
): Promise<LiveblocksAuthRequestBody | Response> {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return errorResponse("Liveblocks room ID is required.", 400);
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

  if (body.room !== undefined && typeof body.room !== "string") {
    return errorResponse("Liveblocks room ID must be a string.", 400);
  }

  return {
    room: body.room,
  };
}

function parseRoomId(room: string | undefined): string | Response {
  const parsedRoom = room?.trim();

  if (!parsedRoom) {
    return errorResponse("Liveblocks room ID is required.", 400);
  }

  return parsedRoom;
}
