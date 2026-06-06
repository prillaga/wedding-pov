"use client";

import { useParams } from "next/navigation";
import WeddingGuestPage from "@/components/wedding/WeddingGuestPage";

/** Join route — skips hero, goes straight to name entry */
export default function JoinPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  return <WeddingGuestPage eventId={eventId} startOnJoin />;
}
