"use client";

import { useParams } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageHeader } from "@/components/layout/PageHeader";
import { useEventPhotos } from "@/hooks/useEventPhotos";
import { POVGallery } from "@/components/gallery/POVGallery";

export default function GalleryPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { photos: uploads } = useEventPhotos(eventId);

  return (
    <main className="min-h-dvh pb-24">
      <PageHeader
        title="POV Gallery"
        subtitle="Every moment from every guest's eyes"
      />
      <div className="px-5">
        <POVGallery eventId={eventId} uploads={uploads} />
      </div>
      <BottomNav eventId={eventId} />
    </main>
  );
}
