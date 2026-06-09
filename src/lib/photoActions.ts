/**
 * Photo actions for Instant Print Center.
 * Keeps print/download/favorite/delete logic centralized for future automation.
 */

import { ADMIN_PASSWORD, ADMIN_AUTH_KEY } from "@/lib/constants";
import { deleteUpload } from "@/lib/store";
import { enqueuePrint } from "@/lib/printQueue";
import type { PrintCenterPhoto } from "@/types/print-center";
import type { PrintQueueItem } from "@/types/print-center";

function adminHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof window !== "undefined") {
    try {
      headers["x-admin-password"] = ADMIN_PASSWORD;
    } catch {
      /* ignore */
    }
  }
  return headers;
}

export interface PrintPhotoResult {
  queueItem: PrintQueueItem | null;
  imageTab: Window | null;
}

/** Download full-res, open in new tab, enqueue print job */
export async function printPhoto(photo: PrintCenterPhoto): Promise<PrintPhotoResult> {
  const imageUrl = photo.imageUrl;

  // Trigger download
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prillaga-${photo.eventId}-${photo.id.slice(0, 8)}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    /* direct URL download fallback below */
  }

  const imageTab = window.open(imageUrl, "_blank", "noopener,noreferrer");
  const queueItem = await enqueuePrint(photo.id, photo.eventId);

  return { queueItem, imageTab };
}

export function downloadPhoto(photo: PrintCenterPhoto): void {
  const a = document.createElement("a");
  a.href = photo.imageUrl;
  a.download = `prillaga-${photo.guestName.replace(/\s+/g, "-")}-${photo.id.slice(0, 8)}.jpg`;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function togglePhotoFavorite(photoId: string): Promise<boolean> {
  const res = await fetch("/api/print-center/favorites", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ photoId }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { favorited: boolean };
  return data.favorited;
}

export async function deletePhoto(photo: PrintCenterPhoto): Promise<boolean> {
  // Local store
  deleteUpload(photo.id);

  // Cloud blob
  await patchRemotePhoto(photo.eventId, photo.id, { status: "removed" });

  // Supabase / server
  const res = await fetch(
    `/api/print-center/photos/${encodeURIComponent(photo.id)}`,
    {
      method: "DELETE",
      headers: adminHeaders(),
      body: JSON.stringify({ eventId: photo.eventId }),
    }
  );

  return res.ok;
}

export async function fetchPrintCenterPhotos(params: {
  cursor?: string;
  limit?: number;
  eventCategory?: string;
  eventIds?: string[];
  favoritesOnly?: boolean;
}): Promise<{
  photos: PrintCenterPhoto[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  const res = await fetch("/api/print-center/photos", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    return { photos: [], nextCursor: null, hasMore: false };
  }

  return (await res.json()) as {
    photos: PrintCenterPhoto[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}

/** Merge client-side local uploads into feed when cloud returns partial data */
export function mergeLocalPhotos(
  remote: PrintCenterPhoto[],
  local: PrintCenterPhoto[]
): PrintCenterPhoto[] {
  const byId = new Map<string, PrintCenterPhoto>();
  for (const p of remote) byId.set(p.id, p);
  for (const p of local) {
    if (!byId.has(p.id)) byId.set(p.id, p);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function uploadToPrintCenterPhoto(
  upload: {
    id: string;
    eventId: string;
    guestId: string;
    guestName: string;
    imageData: string;
    caption?: string;
    segment: PrintCenterPhoto["segment"];
    status: PrintCenterPhoto["status"];
    isVideo: boolean;
    createdAt: string;
  },
  eventName: string,
  eventCategory = "wedding"
): PrintCenterPhoto {
  return {
    id: upload.id,
    eventId: upload.eventId,
    eventName,
    eventCategory,
    guestId: upload.guestId,
    guestName: upload.guestName,
    imageUrl: upload.imageData,
    caption: upload.caption,
    segment: upload.segment,
    status: upload.status,
    isVideo: upload.isVideo,
    createdAt: upload.createdAt,
  };
}
