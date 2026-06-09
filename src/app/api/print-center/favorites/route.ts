import { NextResponse } from "next/server";
import { toggleFavorite, requireAdmin } from "@/lib/server/print-center-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { photoId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.photoId) {
    return NextResponse.json({ error: "photoId required" }, { status: 400 });
  }

  const result = await toggleFavorite(body.photoId);
  return NextResponse.json(result);
}
