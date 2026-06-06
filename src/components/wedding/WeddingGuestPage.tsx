"use client";

import CustomWeddingGuestPage from "@/components/wedding/CustomWeddingGuestPage";
import DemoWeddingGuestPage from "@/components/wedding/DemoWeddingGuestPage";
import { isDemoEventId, normalizeEventId } from "@/lib/demo-event";

interface WeddingGuestPageProps {
  eventId: string;
  startOnJoin?: boolean;
}

export default function WeddingGuestPage({ eventId, startOnJoin = false }: WeddingGuestPageProps) {
  const normalizedId = normalizeEventId(eventId);

  if (isDemoEventId(normalizedId)) {
    return <DemoWeddingGuestPage startOnJoin={startOnJoin} />;
  }

  return (
    <CustomWeddingGuestPage eventId={normalizedId} startOnJoin={startOnJoin} />
  );
}
