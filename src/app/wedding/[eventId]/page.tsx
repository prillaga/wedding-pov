"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CoupleJoinFlow } from "@/components/home/CoupleJoinFlow";
import { EventThemeProvider } from "@/components/theme/EventThemeProvider";
import { ensureEvent } from "@/lib/store";
import type { WeddingEvent } from "@/types";

export default function CoupleHomePage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEvent(ensureEvent(eventId) ?? null);
    setReady(true);
  }, [eventId]);

  if (!ready) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-ivory">
        <p className="text-warm-gray">Loading wedding...</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6 text-center bg-ivory">
        <div>
          <p className="font-serif text-xl mb-2">Event not found</p>
          <p className="text-sm text-warm-gray mb-4">Use demo code:</p>
          <a href="/wedding/prillaga-wedding-2026" className="text-champagne underline">
            prillaga-wedding-2026
          </a>
        </div>
      </main>
    );
  }

  return (
    <EventThemeProvider event={event}>
      <CoupleJoinFlow event={event} />
    </EventThemeProvider>
  );
}
