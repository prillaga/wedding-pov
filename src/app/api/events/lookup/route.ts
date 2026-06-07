import { NextResponse } from "next/server";
import { isCloudStorageConfigured, lookupEventByCode } from "@/lib/server/event-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim();
  if (!code) {
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

  const event = await lookupEventByCode(code);
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
