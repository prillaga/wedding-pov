"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchSlideshowPhotos, slideshowLog } from "@/lib/slideshow-photos";
import type { Upload } from "@/types";

interface UseEventPhotosOptions {
  pollIntervalMs?: number;
  enabled?: boolean;
}

export function useEventPhotos(eventId: string, options: UseEventPhotosOptions = {}) {
  const { pollIntervalMs = 3000, enabled = true } = options;
  const [photos, setPhotos] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!eventId) return;
    try {
      const next = await fetchSlideshowPhotos(eventId);
      setPhotos(next);
      setError(null);
      slideshowLog("Realtime refresh", { count: next.length, eventId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load photos";
      setError(message);
      slideshowLog("Photo refresh error", message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!enabled || !eventId) return;

    setLoading(true);
    refresh();

    const interval = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(interval);
  }, [eventId, enabled, pollIntervalMs, refresh]);

  return { photos, loading, error, refresh };
}
