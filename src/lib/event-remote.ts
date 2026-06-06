import { ADMIN_AUTH_KEY, ADMIN_PASSWORD } from "@/lib/constants";
import { getHardcodedDemoEvent, isDemoEventId, normalizeEventId } from "@/lib/demo-event";
import { getPublicEvent } from "@/lib/public-events";
import type { WeddingEvent } from "@/types";

function getAdminPasswordHeader(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const authed = sessionStorage.getItem(ADMIN_AUTH_KEY) === "1";
    return authed ? ADMIN_PASSWORD : ADMIN_PASSWORD;
  } catch {
    return ADMIN_PASSWORD;
  }
}

export async function fetchRemoteEvent(eventId: string): Promise<WeddingEvent | null> {
  const id = normalizeEventId(eventId);
  if (!id) return null;

  if (isDemoEventId(id)) {
    return getPublicEvent(id) ?? getHardcodedDemoEvent();
  }

  try {
    const res = await fetch(`/api/events/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { event?: WeddingEvent };
    return data.event ?? null;
  } catch {
    return null;
  }
}

export async function pushRemoteEvent(event: WeddingEvent): Promise<boolean> {
  try {
    const res = await fetch(`/api/events/${encodeURIComponent(event.id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": getAdminPasswordHeader() ?? ADMIN_PASSWORD,
      },
      body: JSON.stringify(event),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function syncAllLocalEventsToCloud(
  events: WeddingEvent[]
): Promise<{ synced: number; failed: number }> {
  let synced = 0;
  let failed = 0;
  for (const event of events) {
    const ok = await pushRemoteEvent(event);
    if (ok) synced += 1;
    else failed += 1;
  }
  return { synced, failed };
}
