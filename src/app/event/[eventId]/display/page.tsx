"use client";

import { useLayoutEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PresentationSlideshow } from "@/components/slideshow/PresentationSlideshow";
import { useEventPhotos } from "@/hooks/useEventPhotos";
import { loadEventForGuest, seedSampleUploads } from "@/lib/store";
import type { WeddingEvent } from "@/types";

export default function DisplayModePage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { photos, loading, refresh } = useEventPhotos(eventId, { pollIntervalMs: 2000 });
  const [event, setEvent] = useState<WeddingEvent | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    void loadEventForGuest(eventId).then((loaded) => {
      if (cancelled) return;
      if (loaded) seedSampleUploads(eventId);
      setEvent(loaded);
      refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, refresh]);

  return (
    <PresentationSlideshow
      eventId={eventId}
      coupleName={event?.coupleName}
      uploads={photos}
      loading={loading}
      displayMode
      style={event?.slideshow.style ?? "fade"}
      interval={event?.slideshow.transitionDuration ?? 5000}
      showTimestamp={event?.slideshow.showTimestamp ?? true}
      showPhotoCount={event?.slideshow.showPhotoCount ?? true}
      showGuestNames={event?.slideshow.showGuestNames ?? true}
      intro={event?.slideshow.intro}
      outro={event?.slideshow.outro}
      musicEnabled={event?.slideshow.music.enabled}
      music={event?.slideshow.music}
      exitHref={`/event/${eventId}`}
    />
  );
}
