import { ensureUploadsHydrated, getApprovedUploads } from "@/lib/store";
import { fetchPhotosFromFirebase, isFirebaseConfigured } from "@/lib/firebase";
import {
  fetchRemotePhotos,
  mergeEventPhotos,
  syncLocalPhotosToCloud,
} from "@/lib/photo-remote";
import type { Upload } from "@/types";

const DEBUG = process.env.NODE_ENV === "development";

export function slideshowLog(message: string, data?: unknown): void {
  if (DEBUG) {
    console.log(`[WeddingPOV Slideshow] ${message}`, data ?? "");
  }
}

/** Approved visible photos — matches gallery; includes pending uploads awaiting review */
export function filterSlideshowPhotos(uploads: Upload[]): Upload[] {
  return uploads
    .filter(
      (u) =>
        u.status !== "removed" &&
        (u.status === "approved" || u.status === "pending" || u.status === "extra")
    )
    .sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

export function getSlideshowPhotos(eventId: string): Upload[] {
  const photos = filterSlideshowPhotos(getApprovedUploads(eventId));
  slideshowLog(`Loaded ${photos.length} slideshow photo(s) from local store`, {
    eventId,
    ids: photos.map((p) => p.id),
  });
  return photos;
}

export async function fetchSlideshowPhotos(eventId: string): Promise<Upload[]> {
  await ensureUploadsHydrated();
  const local = getSlideshowPhotos(eventId);

  if (isFirebaseConfigured()) {
    try {
      const remote = await fetchPhotosFromFirebase(eventId);
      if (remote && remote.length >= 0) {
        const photos = filterSlideshowPhotos(mergeEventPhotos(local, remote));
        slideshowLog(`Loaded ${photos.length} slideshow photo(s) from Firebase`, { eventId });
        return photos;
      }
    } catch (err) {
      slideshowLog("Firebase fetch failed — trying cloud API", err);
    }
  }

  const remote = await fetchRemotePhotos(eventId);
  if (remote) {
    const merged = filterSlideshowPhotos(mergeEventPhotos(local, remote));
    slideshowLog(`Loaded ${merged.length} slideshow photo(s) (${remote.length} from cloud)`, {
      eventId,
    });
    void syncLocalPhotosToCloud(eventId, local);
    return merged;
  }

  void syncLocalPhotosToCloud(eventId, local);
  return local;
}

/** Clamp index when photo list shrinks or IDs change (delete/replace) */
export function clampSlideIndex(index: number, photoCount: number): number {
  if (photoCount <= 0) return 0;
  return Math.min(Math.max(0, index), photoCount - 1);
}

export function nextSlideIndex(current: number, photoCount: number): number {
  if (photoCount <= 0) return 0;
  if (photoCount === 1) return 0;
  return (current + 1) % photoCount;
}

export function prevSlideIndex(current: number, photoCount: number): number {
  if (photoCount <= 0) return 0;
  if (photoCount === 1) return 0;
  return (current - 1 + photoCount) % photoCount;
}
