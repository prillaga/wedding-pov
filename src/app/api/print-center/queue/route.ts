import { NextResponse } from "next/server";
import {
  addToPrintQueue,
  getPendingQueue,
  requireAdmin,
} from "@/lib/server/print-center-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await getPendingQueue();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { photoId?: string; eventId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.photoId || !body.eventId) {
    return NextResponse.json({ error: "photoId and eventId required" }, { status: 400 });
  }

  const item = await addToPrintQueue(body.photoId, body.eventId);
  if (!item) {
    return NextResponse.json({ error: "Failed to enqueue" }, { status: 500 });
  }

  return NextResponse.json({ item });
}
