"use client";

import { useLayoutEffect, useState } from "react";
import { loadEventForGuest } from "@/lib/store";
import type { WeddingEvent } from "@/types";

/** Load wedding event from local cache, built-in demo, or cloud API. */
export function useEventLoader(eventId: string): WeddingEvent | null | undefined {
  const [event, setEvent] = useState<WeddingEvent | null | undefined>(undefined);

  useLayoutEffect(() => {
    let cancelled = false;

    void loadEventForGuest(eventId).then((loaded) => {
      if (!cancelled) setEvent(loaded);
    });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return event;
}
