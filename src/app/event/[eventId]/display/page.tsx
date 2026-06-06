"use client";

import { useLayoutEffect } from "react";
import { useParams } from "next/navigation";
import { PresentationSlideshow } from "@/components/slideshow/PresentationSlideshow";
import { useEventPhotos } from "@/hooks/useEventPhotos";
import { getEvent, seedDemoEvent, seedSampleUploads } from "@/lib/store";

export default function DisplayModePage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { photos, loading, refresh } = useEventPhotos(eventId, { pollIntervalMs: 2000 });

  useLayoutEffect(() => {
    seedDemoEvent();
    seedSampleUploads(eventId);
    refresh();
  }, [eventId, refresh]);

  const event = getEvent(eventId);

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
      exitHref={`/event/${eventId}`}
    />
  );
}
