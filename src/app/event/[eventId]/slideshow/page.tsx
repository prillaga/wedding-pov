"use client";

import { useParams } from "next/navigation";
import { PresentationSlideshow } from "@/components/slideshow/PresentationSlideshow";
import { useEventPhotos } from "@/hooks/useEventPhotos";
import { getEvent } from "@/lib/store";

export default function SlideshowPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { photos, loading } = useEventPhotos(eventId, { pollIntervalMs: 3000 });
  const event = getEvent(eventId);

  return (
    <PresentationSlideshow
      eventId={eventId}
      coupleName={event?.coupleName}
      uploads={photos}
      loading={loading}
      style={event?.slideshow.style ?? "fade"}
      interval={event?.slideshow.transitionDuration ?? 5000}
      showTimestamp={event?.slideshow.showTimestamp ?? true}
      showGuestNames={event?.slideshow.showGuestNames ?? true}
      intro={event?.slideshow.intro}
      outro={event?.slideshow.outro}
      musicEnabled={event?.slideshow.music.enabled}
      exitHref={`/event/${eventId}`}
    />
  );
}
