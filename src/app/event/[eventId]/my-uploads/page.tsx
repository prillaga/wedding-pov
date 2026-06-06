"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MyUploads } from "@/components/camera/MyUploads";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageHeader } from "@/components/layout/PageHeader";
import { getGuest, getSession } from "@/lib/store";
import type { Guest } from "@/types";

export default function MyUploadsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const [guest, setGuest] = useState<Guest | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session || session.eventId !== eventId) {
      router.push(`/join/${eventId}`);
      return;
    }
    const g = getGuest(session.guestId);
    if (g) setGuest(g);
  }, [eventId, router]);

  if (!guest) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-warm-gray">Loading…</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen-safe pb-24 sm:pb-28">
      <PageHeader title="My Uploads" subtitle="Manage your wedding POV photos" />
      <div className="px-4 sm:px-5 py-4 sm:py-6 safe-x">
        <MyUploads
          eventId={eventId}
          guest={guest}
          onReplace={(uploadId) =>
            router.push(`/event/${eventId}/camera?replace=${uploadId}`)
          }
        />
      </div>
      <BottomNav eventId={eventId} />
    </main>
  );
}
