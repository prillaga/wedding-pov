"use client";

import { useParams } from "next/navigation";
import WeddingGuestPage from "@/components/wedding/WeddingGuestPage";

export default function CoupleHomePage() {
  const params = useParams();
  const eventId = typeof params.eventId === "string" ? params.eventId : "";

  return <WeddingGuestPage eventId={eventId} />;
}
