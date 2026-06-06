"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CoupleJoinFlow } from "@/components/home/CoupleJoinFlow";
import { EventThemeProvider } from "@/components/theme/EventThemeProvider";
import { LoadingShell } from "@/components/ui/LoadingShell";
import { getEventStatusLabel, isEventJoinable } from "@/lib/event-utils";
import { loadEventForGuest } from "@/lib/store";
import type { WeddingEvent } from "@/types";

interface CustomWeddingGuestPageProps {
  eventId: string;
  startOnJoin?: boolean;
}

export default function CustomWeddingGuestPage({
  eventId,
  startOnJoin = false,
}: CustomWeddingGuestPageProps) {
  const [event, setEvent] = useState<WeddingEvent | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void loadEventForGuest(eventId).then((loaded) => {
      if (!cancelled) setEvent(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (event === undefined) {
    return <LoadingShell message="Loading wedding..." />;
  }

  if (!event) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6 text-center bg-ivory">
        <div>
          <p className="font-serif text-xl mb-2">Event not found</p>
          <p className="text-sm text-warm-gray mb-4">
            Ask your wedding coordinator for the correct QR code or invitation link.
            If you are the coordinator, open the admin dashboard and save the event so it
            syncs for all guest devices.
          </p>
          <Link href="/" className="text-champagne underline">
            Scan QR code
          </Link>
          <p className="mt-4 text-sm">
            <Link href="/WeddingPOV.html" className="text-champagne underline">
              Open offline demo
            </Link>
          </p>
        </div>
      </main>
    );
  }

  if (!isEventJoinable(event)) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6 text-center bg-ivory">
        <div className="max-w-sm">
          <p className="font-serif text-xl mb-2">{event.coupleName}</p>
          <p className="text-sm text-warm-gray mb-2">
            This wedding is currently <strong>{getEventStatusLabel(event.status)}</strong> and not
            accepting new guests.
          </p>
        </div>
      </main>
    );
  }

  return (
    <EventThemeProvider event={event}>
      <CoupleJoinFlow event={event} startOnJoin={startOnJoin} />
    </EventThemeProvider>
  );
}
