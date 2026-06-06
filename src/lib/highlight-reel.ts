import type { HighlightReelType, Upload } from "@/types";

function guestKey(photo: Upload): string {
  return photo.guestId || photo.guestName.trim().toLowerCase();
}

/** Mix photos from every guest so the slideshow rotates POVs instead of one person at a time. */
export function orderSlideshowPhotosMixed(uploads: Upload[]): Upload[] {
  if (uploads.length <= 1) return uploads;

  const byGuest = new Map<string, Upload[]>();
  for (const photo of uploads) {
    const key = guestKey(photo);
    const bucket = byGuest.get(key);
    if (bucket) bucket.push(photo);
    else byGuest.set(key, [photo]);
  }

  for (const bucket of byGuest.values()) {
    bucket.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  const buckets = Array.from(byGuest.values()).sort((a, b) => {
    const aTime = new Date(a[0]?.createdAt ?? 0).getTime();
    const bTime = new Date(b[0]?.createdAt ?? 0).getTime();
    return aTime - bTime;
  });

  const mixed: Upload[] = [];
  let round = 0;
  while (mixed.length < uploads.length) {
    let added = false;
    for (const bucket of buckets) {
      if (round < bucket.length) {
        mixed.push(bucket[round]);
        added = true;
      }
    }
    if (!added) break;
    round += 1;
  }

  return mixed;
}

const HIGHLIGHT_LIMITS: Record<HighlightReelType, number> = {
  "1min": 20,
  "3min": 36,
  full: Number.POSITIVE_INFINITY,
};

export function buildHighlightReel(
  uploads: Upload[],
  type: HighlightReelType
): Upload[] {
  const mixed = orderSlideshowPhotosMixed(uploads);
  const limit = HIGHLIGHT_LIMITS[type];
  return Number.isFinite(limit) ? mixed.slice(0, limit) : mixed;
}

export function countUniqueGuests(uploads: Upload[]): number {
  return new Set(uploads.map(guestKey)).size;
}
