import { NextResponse } from "next/server";
import { getCloudStorageKind, isCloudStorageConfigured } from "@/lib/server/event-store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    cloudConfigured: isCloudStorageConfigured(),
    kind: getCloudStorageKind(),
  });
}
