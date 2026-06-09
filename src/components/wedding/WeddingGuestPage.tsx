"use client";

import CustomWeddingGuestPage from "@/components/wedding/CustomWeddingGuestPage";
import { normalizeEventId } from "@/lib/demo-event";
import { resolveEventIdAlias } from "@/lib/public-events";

interface WeddingGuestPageProps {
  eventId: string;
  startOnJoin?: boolean;
}

export default function WeddingGuestPage({ eventId, startOnJoin = false }: WeddingGuestPageProps) {
  const normalizedId = resolveEventIdAlias(normalizeEventId(eventId));

  return <CustomWeddingGuestPage eventId={normalizedId} startOnJoin={startOnJoin} />;
}
