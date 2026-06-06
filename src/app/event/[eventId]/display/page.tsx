"use client";

import { useParams } from "next/navigation";
import { PresentationSlideshow } from "@/components/slideshow/PresentationSlideshow";
import { useEventPhotos } from "@/hooks/useEventPhotos";
import { getEvent } from "@/lib/store";

export default function DisplayModePage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const event = getEvent(eventId);
  const { photos, loading } = useEventPhotos(eventId, { pollIntervalMs: 2000 });

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
