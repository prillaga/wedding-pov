"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { WeddingCamera } from "@/components/camera/WeddingCamera";
import { getGuest, getSession } from "@/lib/store";
import type { Guest } from "@/types";

function CameraContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = params.eventId as string;
  const replaceUploadId = searchParams.get("replace") ?? undefined;
  const [guest, setGuest] = useState<Guest | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session || session.eventId !== eventId) {
      router.push(`/wedding/${eventId}`);
      return;
    }
    const g = getGuest(session.guestId);
    if (g) setGuest(g);
  }, [eventId, router]);

  if (!guest) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-charcoal">
        <p className="text-ivory/60">Loading camera...</p>
      </div>
    );
  }

  return (
    <WeddingCamera
      eventId={eventId}
      guest={guest}
      replaceUploadId={replaceUploadId}
      onNavigate={(destination) => {
        switch (destination) {
          case "gallery":
            router.push(`/event/${eventId}/gallery`);
            break;
          case "my-uploads":
            router.push(`/event/${eventId}/my-uploads`);
            break;
          case "home":
            router.push(`/event/${eventId}`);
            break;
        }
      }}
      onLimitBack={() =>
        router.push(replaceUploadId ? `/event/${eventId}/my-uploads` : `/event/${eventId}`)
      }
    />
  );
}

export default function CameraPage() {
  return (
    <main className="fixed inset-0 z-40 h-screen-safe">
      <Suspense
        fallback={
          <div className="min-h-dvh flex items-center justify-center bg-charcoal">
            <p className="text-ivory/60">Loading camera...</p>
          </div>
        }
      >
        <CameraContent />
      </Suspense>
    </main>
  );
}
