import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import {
  getCloudStorageKind,
  isCloudStorageConfigured,
  verifyAdminPassword,
} from "@/lib/server/event-store";
import { normalizeEventId } from "@/lib/demo-event";

export const dynamic = "force-dynamic";

const MAX_BYTES = 50 * 1024 * 1024;

const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/aac",
  "audio/ogg",
  "audio/*",
];

export async function POST(
  request: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;
  const id = normalizeEventId(eventId);
  if (!id) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  if (!verifyAdminPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isCloudStorageConfigured()) {
    return NextResponse.json(
      {
        error: "Cloud storage is not connected. Connect Vercel Blob to upload music.",
        cloudConfigured: false,
        kind: getCloudStorageKind(),
      },
      { status: 503 }
    );
  }

  const body = (await request.json()) as HandleUploadBody;
  const expectedPrefix = `wedding-pov/events/${id}/slideshow-music.`;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(expectedPrefix)) {
          throw new Error("Invalid music upload path");
        }
        return {
          allowedContentTypes: ALLOWED_AUDIO_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          allowOverwrite: true,
          addRandomSuffix: false,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Music upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
