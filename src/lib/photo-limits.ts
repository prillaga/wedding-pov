import type { EventSegment, GuestUploadQuota, PhotoLimitSettings, Upload } from "@/types";

function countsTowardGuestLimit(
  u: Upload,
  guestId: string,
  options?: { segment?: EventSegment; since?: Date; excludeExtra?: boolean }
): boolean {
  if (u.guestId !== guestId) return false;
  if (options?.excludeExtra && u.isExtra) return false;
  if (options?.segment && u.segment !== options.segment) return false;
  if (options?.since && new Date(u.createdAt) < options.since) return false;

  if (u.status === "removed") return u.slotLocked === true;
  return true;
}

function countGuestUploads(
  uploads: Upload[],
  guestId: string,
  options?: { segment?: EventSegment; since?: Date; excludeExtra?: boolean }
): number {
  return uploads.filter((u) => countsTowardGuestLimit(u, guestId, options)).length;
}

export function getGuestUploadQuota(
  limits: PhotoLimitSettings,
  uploads: Upload[],
  guestId: string,
  currentSegment?: EventSegment
): GuestUploadQuota {
  if (!limits.enabled || limits.maxPhotos === "unlimited" || limits.limitReachedBehavior === "unlimited") {
    const used = countGuestUploads(uploads, guestId);
    return {
      used,
      max: null,
      remaining: null,
      isLimited: false,
      isAtLimit: false,
      canUpload: true,
      limitType: limits.type,
    };
  }

  const max = limits.maxPhotos;
  let used = 0;

  switch (limits.type) {
    case "hourly": {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      used = countGuestUploads(uploads, guestId, { since: oneHourAgo, excludeExtra: true });
      break;
    }
    case "per-section": {
      used = countGuestUploads(uploads, guestId, {
        segment: currentSegment,
        excludeExtra: true,
      });
      break;
    }
    default:
      used = countGuestUploads(uploads, guestId, { excludeExtra: true });
  }

  const remaining = Math.max(0, max - used);
  const isAtLimit = used >= max;

  return {
    used,
    max,
    remaining,
    isLimited: true,
    isAtLimit,
    canUpload: !isAtLimit || limits.limitReachedBehavior === "mark-extra",
    limitType: limits.type,
  };
}

export function canGuestUpload(
  limits: PhotoLimitSettings,
  uploads: Upload[],
  guestId: string,
  segment?: EventSegment
): { allowed: boolean; markAsExtra: boolean; quota: GuestUploadQuota } {
  const quota = getGuestUploadQuota(limits, uploads, guestId, segment);

  if (!limits.enabled || limits.maxPhotos === "unlimited" || limits.limitReachedBehavior === "unlimited") {
    return { allowed: true, markAsExtra: false, quota };
  }

  if (!quota.isAtLimit) {
    return { allowed: true, markAsExtra: false, quota };
  }

  if (limits.limitReachedBehavior === "mark-extra") {
    return { allowed: true, markAsExtra: true, quota };
  }

  return { allowed: false, markAsExtra: false, quota };
}
