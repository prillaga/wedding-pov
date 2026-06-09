import { NextResponse } from "next/server";
import {
  fetchPrintCenterPhotos,
  requireAdmin,
} from "@/lib/server/print-center-store";
import type { PrintCenterPhotosQuery } from "@/types/print-center";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PrintCenterPhotosQuery;
  try {
    body = (await request.json()) as PrintCenterPhotosQuery;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await fetchPrintCenterPhotos(body);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load photos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
