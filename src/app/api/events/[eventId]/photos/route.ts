import { NextResponse } from "next/server";
import {
  getCloudStorageKind,
  isCloudStorageConfigured,
  verifyAdminPassword,
} from "@/lib/server/event-store";
import { addPhotoToCloud, listPhotosFromCloud } from "@/lib/server/photo-store";
import { normalizeEventId } from "@/lib/demo-event";
import type { Upload } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  _request: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;
  const id = normalizeEventId(eventId);
  if (!id) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  if (!isCloudStorageConfigured()) {
    return NextResponse.json({
      photos: [],
      cloudConfigured: false,
      kind: getCloudStorageKind(),
    });
  }

  const photos = await listPhotosFromCloud(id);
  return NextResponse.json({
    photos,
    cloudConfigured: true,
    kind: getCloudStorageKind(),
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;
  const id = normalizeEventId(eventId);
  if (!id) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  if (!isCloudStorageConfigured()) {
    return NextResponse.json(
      {
        error: "Cloud storage is not connected.",
        cloudConfigured: false,
        kind: getCloudStorageKind(),
      },
      { status: 503 }
    );
  }

  let body: Upload;
  try {
    body = (await request.json()) as Upload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (normalizeEventId(body.eventId) !== id) {
    return NextResponse.json({ error: "Event id mismatch" }, { status: 400 });
  }

  if (!body.id || !body.guestId || !body.imageData) {
    return NextResponse.json({ error: "Missing required photo fields" }, { status: 400 });
  }

  try {
    const meta = await addPhotoToCloud({ ...body, eventId: id });
    if (!meta) {
      return NextResponse.json({ error: "Failed to save photo" }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      photo: { ...meta, imageData: meta.imageUrl },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;
  const id = normalizeEventId(eventId);
  if (!id) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  if (!isCloudStorageConfigured()) {
    return NextResponse.json({ error: "Cloud storage not configured" }, { status: 503 });
  }

  let body: {
    photoId: string;
    guestId?: string;
    status?: Upload["status"];
    caption?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const isAdmin = verifyAdminPassword(request.headers.get("x-admin-password"));
  if (!isAdmin && !body.guestId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { updatePhotoInCloud } = await import("@/lib/server/photo-store");
  const ok = await updatePhotoInCloud(id, body.photoId, {
    status: body.status,
    caption: body.caption,
  });

  if (!ok) {
    return NextResponse.json({ error: "Photo not found or update failed" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
