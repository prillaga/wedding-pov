import { ADMIN_AUTH_KEY, ADMIN_PASSWORD } from "@/lib/constants";
import { normalizeEventId } from "@/lib/demo-event";
import type { Upload } from "@/types";

function getAdminPasswordHeader(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const authed = sessionStorage.getItem(ADMIN_AUTH_KEY) === "1";
    return authed ? ADMIN_PASSWORD : ADMIN_PASSWORD;
  } catch {
    return ADMIN_PASSWORD;
  }
}

export async function fetchRemotePhotos(eventId: string): Promise<Upload[] | null> {
  const id = normalizeEventId(eventId);
  if (!id) return null;

  try {
    const res = await fetch(`/api/events/${encodeURIComponent(id)}/photos`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { photos?: Upload[]; cloudConfigured?: boolean };
    if (!data.cloudConfigured) return null;
    return data.photos ?? [];
  } catch {
    return null;
  }
}

export async function pushRemotePhoto(upload: Upload): Promise<{ ok: boolean; error?: string }> {
  const id = normalizeEventId(upload.eventId);
  if (!id || !upload.imageData) {
    return { ok: false, error: "Missing event or image data" };
  }

  try {
    const res = await fetch(`/api/events/${encodeURIComponent(id)}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...upload, eventId: id }),
    });
    if (res.ok) return { ok: true };
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: data.error ?? `Sync failed (${res.status})` };
  } catch {
    return { ok: false, error: "Network error — photo not synced to cloud" };
  }
}

export async function patchRemotePhoto(
  eventId: string,
  photoId: string,
  patch: { status?: Upload["status"]; caption?: string; guestId?: string }
): Promise<boolean> {
  const id = normalizeEventId(eventId);
  if (!id) return false;

  try {
    const res = await fetch(`/api/events/${encodeURIComponent(id)}/photos`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": getAdminPasswordHeader() ?? ADMIN_PASSWORD,
      },
      body: JSON.stringify({ photoId, ...patch }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const syncingEvents = new Set<string>();

/** Push local-only photos to cloud (background, deduped per event). */
export async function syncLocalPhotosToCloud(
  eventId: string,
  localPhotos: Upload[]
): Promise<void> {
  const id = normalizeEventId(eventId);
  if (!id || localPhotos.length === 0) return;
  if (syncingEvents.has(id)) return;

  syncingEvents.add(id);
  try {
    const remote = (await fetchRemotePhotos(id)) ?? [];
    const remoteIds = new Set(remote.map((p) => p.id));

    for (const photo of localPhotos) {
      if (remoteIds.has(photo.id)) continue;
      if (!photo.imageData || photo.status === "removed") continue;
      await pushRemotePhoto(photo);
    }
  } finally {
    syncingEvents.delete(id);
  }
}

export function mergeEventPhotos(local: Upload[], remote: Upload[]): Upload[] {
  const byId = new Map<string, Upload>();

  for (const photo of remote) {
    if (photo.status !== "removed") {
      byId.set(photo.id, photo);
    }
  }

  for (const photo of local) {
    if (photo.status === "removed") continue;
    if (!byId.has(photo.id)) {
      byId.set(photo.id, photo);
    }
  }

  return Array.from(byId.values());
}
