"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CoupleJoinFlow } from "@/components/home/CoupleJoinFlow";
import { EventThemeProvider } from "@/components/theme/EventThemeProvider";
import { ensureEvent } from "@/lib/store";
import type { WeddingEvent } from "@/types";

/** Join route — same inline join flow as couple homepage */
export default function JoinPage() {
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
      <main className="min-h-dvh flex items-center justify-center">
        <p className="text-warm-gray">Loading...</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6 text-center">
        <p className="text-warm-gray">Event not found</p>
      </main>
    );
  }

  return (
    <EventThemeProvider event={event}>
      <CoupleJoinFlow event={event} startOnJoin />
    </EventThemeProvider>
  );
}
