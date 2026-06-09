import { NextResponse } from "next/server";
import { markQueuePrinted, requireAdmin } from "@/lib/server/print-center-store";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { status?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.status !== "printed") {
    return NextResponse.json({ error: "Only status=printed supported" }, { status: 400 });
  }

  const ok = await markQueuePrinted(id);
  if (!ok) {
    return NextResponse.json({ error: "Update failed" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
