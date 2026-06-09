"use client";

import { useLayoutEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PresentationSlideshow } from "@/components/slideshow/PresentationSlideshow";
import { useEventPhotos } from "@/hooks/useEventPhotos";
import { isDemoEventId } from "@/lib/demo-event";
import { loadEventForGuest, seedSampleUploads } from "@/lib/store";
import type { WeddingEvent } from "@/types";

export default function DisplayModePage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const isDemo = isDemoEventId(eventId);
  const [demoReady, setDemoReady] = useState(!isDemo);
  const { photos, loading, refresh } = useEventPhotos(eventId, {
    pollIntervalMs: 2000,
    enabled: demoReady,
  });
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [eventLoading, setEventLoading] = useState(true);

  useLayoutEffect(() => {
    let cancelled = false;
    void loadEventForGuest(eventId).then(async (loaded) => {
      if (cancelled) return;
      if (loaded) await seedSampleUploads(eventId);
      if (isDemo) setDemoReady(true);
      if (loaded) refresh();
      setEvent(loaded);
      setEventLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, isDemo, refresh]);

  return (
    <PresentationSlideshow
      eventId={eventId}
      coupleName={event?.coupleName}
      uploads={photos}
      loading={loading}
      eventLoading={eventLoading}
      displayMode
      style={event?.slideshow.style ?? "cinematic-pan"}
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
