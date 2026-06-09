"use client";

import { useLayoutEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageHeader } from "@/components/layout/PageHeader";
import { useEventPhotos } from "@/hooks/useEventPhotos";
import { POVGallery } from "@/components/gallery/POVGallery";
import { isDemoEventId } from "@/lib/demo-event";
import { loadEventForGuest, seedSampleUploads } from "@/lib/store";

export default function GalleryPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const isDemo = isDemoEventId(eventId);
  const [demoReady, setDemoReady] = useState(!isDemo);
  const { photos: uploads, refresh } = useEventPhotos(eventId, { enabled: demoReady });

  useLayoutEffect(() => {
    if (!isDemo) return;
    void loadEventForGuest(eventId).then(async (loaded) => {
      if (loaded) await seedSampleUploads(eventId);
      setDemoReady(true);
      refresh();
    });
  }, [eventId, isDemo, refresh]);

  return (
    <main className="min-h-screen-safe pb-24 sm:pb-28">
      <PageHeader
        title="POV Gallery"
        subtitle="Every moment from every guest's eyes"
      />
      <div className="px-4 sm:px-5 safe-x">
        <POVGallery eventId={eventId} uploads={uploads} />
      </div>
      <BottomNav eventId={eventId} />
    </main>
  );
}
