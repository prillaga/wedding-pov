import { NextResponse } from "next/server";
import {
  getCloudStorageKind,
  isCloudStorageConfigured,
  readEventFromCloud,
  verifyAdminPassword,
  writeEventToCloud,
} from "@/lib/server/event-store";
import { normalizeEventId } from "@/lib/demo-event";
import type { WeddingEvent } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;
  const id = normalizeEventId(eventId);
  if (!id) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  const event = await readEventFromCloud(id);
  if (!event) {
    return NextResponse.json(
      {
        error: "Event not found",
        cloudConfigured: isCloudStorageConfigured(),
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ event, cloudConfigured: isCloudStorageConfigured() });
}

export async function PUT(
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
        error:
          "Cloud storage is not connected. In Vercel: Storage → Create Blob Store → connect to wedding-pov.",
        cloudConfigured: false,
        kind: getCloudStorageKind(),
      },
      { status: 503 }
    );
  }

  let body: WeddingEvent;
  try {
    body = (await request.json()) as WeddingEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (normalizeEventId(body.id) !== id) {
    return NextResponse.json({ error: "Event id mismatch" }, { status: 400 });
  }

  const ok = await writeEventToCloud(body);
  if (!ok) {
    return NextResponse.json({ error: "Failed to save event" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, eventId: id });
}
