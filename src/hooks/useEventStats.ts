"use client";

import { useCallback, useEffect, useState } from "react";
import { countUniqueGuests } from "@/lib/highlight-reel";
import { getEventStats, getUploads } from "@/lib/store";
import type { EventStats } from "@/types";

export interface LiveEventStats extends EventStats {
  guestPOVs: number;
}

export function useEventStats(eventId: string, pollIntervalMs = 3000) {
  const [stats, setStats] = useState<LiveEventStats>(() => computeStats(eventId));

  const refresh = useCallback(() => {
    setStats(computeStats(eventId));
  }, [eventId]);

  useEffect(() => {
    refresh();
    if (pollIntervalMs <= 0) return;
    const timer = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(timer);
  }, [eventId, pollIntervalMs, refresh]);

  return { stats, refresh };
}

function computeStats(eventId: string): LiveEventStats {
  const base = getEventStats(eventId);
  const uploads = getUploads(eventId).filter((u) => u.status !== "removed");
  return {
    ...base,
    guestPOVs: countUniqueGuests(uploads),
  };
}
