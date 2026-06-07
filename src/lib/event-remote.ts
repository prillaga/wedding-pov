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

  try {
    const res = await fetch(`/api/events/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { event?: WeddingEvent };
    return data.event ?? null;
  } catch {
    if (isDemoEventId(id)) {
      return getPublicEvent(id) ?? getHardcodedDemoEvent();
    }
    return null;
  }
}

/** Resolve event id, slug, link, or short code (e.g. JJ2027) from cloud. */
export async function lookupRemoteEventByCode(code: string): Promise<WeddingEvent | null> {
  const trimmed = code.trim();
  if (!trimmed) return null;

  try {
    const res = await fetch(`/api/events/lookup?code=${encodeURIComponent(trimmed)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { event?: WeddingEvent };
    return data.event ?? null;
  } catch {
    return null;
  }
}

export async function pushRemoteEvent(event: WeddingEvent): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/events/${encodeURIComponent(event.id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": getAdminPasswordHeader() ?? ADMIN_PASSWORD,
      },
      body: JSON.stringify(event),
    });
    if (res.ok) return { ok: true };
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: data.error ?? `Sync failed (${res.status})` };
  } catch {
    return { ok: false, error: "Network error — could not reach cloud" };
  }
}

export async function syncAllLocalEventsToCloud(
  events: WeddingEvent[]
): Promise<{ synced: number; failed: number; lastError?: string }> {
  let synced = 0;
  let failed = 0;
  let lastError: string | undefined;
  for (const event of events) {
    const result = await pushRemoteEvent(event);
    if (result.ok) synced += 1;
    else {
      failed += 1;
      lastError = result.error;
    }
  }
  return { synced, failed, lastError };
}

export async function fetchCloudStorageStatus(): Promise<{
  cloudConfigured: boolean;
  kind: string;
}> {
  try {
    const res = await fetch("/api/events/status", { cache: "no-store" });
    if (!res.ok) return { cloudConfigured: false, kind: "none" };
    return (await res.json()) as { cloudConfigured: boolean; kind: string };
  } catch {
    return { cloudConfigured: false, kind: "none" };
  }
}
