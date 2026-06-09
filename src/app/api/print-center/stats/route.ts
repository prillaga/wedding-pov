import { NextResponse } from "next/server";
import { getPrintCenterStats, requireAdmin } from "@/lib/server/print-center-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { eventIds?: string[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const stats = await getPrintCenterStats(body.eventIds ?? []);
  return NextResponse.json(stats);
}
