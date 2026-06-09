import { NextResponse } from "next/server";
import { getPrintHistory, requireAdmin } from "@/lib/server/print-center-store";
import type { PrintHistoryFilter } from "@/types/print-center";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = (searchParams.get("filter") ?? "all") as PrintHistoryFilter;

  const items = await getPrintHistory(filter);
  return NextResponse.json({ items });
}
