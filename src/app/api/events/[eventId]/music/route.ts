import { NextResponse } from "next/server";
import {
  getCloudStorageKind,
  isCloudStorageConfigured,
  verifyAdminPassword,
} from "@/lib/server/event-store";
import { uploadSlideshowMusic } from "@/lib/server/music-store";
import { normalizeEventId } from "@/lib/demo-event";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Legacy small-file upload — prefer client upload at /music/upload for larger tracks. */
const MAX_BYTES = 4 * 1024 * 1024;

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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("music");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing music file" }, { status: 400 });
  }

  if (!file.type.startsWith("audio/") && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
    return NextResponse.json({ error: "Please upload an audio file (MP3, WAV, M4A)" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error:
          "File too large for server upload. The app now uploads directly to cloud — refresh the page and try again.",
      },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadSlideshowMusic(id, buffer, file.type || "audio/mpeg", file.name);
  if (!url) {
    return NextResponse.json({ error: "Failed to upload music" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    trackUrl: url,
    trackName: file.name.replace(/\.[^.]+$/, ""),
  });
}
