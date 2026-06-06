"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { PageHeader } from "@/components/layout/PageHeader";
import { getEvent, seedDemoEvent } from "@/lib/store";
import type { WeddingEvent } from "@/types";
import { ArrowLeft } from "lucide-react";

export default function DashboardPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedDemoEvent();
    setEvent(getEvent(eventId) ?? null);
    setReady(true);
  }, [eventId]);

  if (!ready) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <p className="text-warm-gray">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh pb-8">
      <PageHeader
        title="Couple Dashboard"
        subtitle={event ? `${event.coupleName} — Manage your wedding memories` : "Event management"}
      >
        <Link href="/" className="p-2 rounded-full hover:bg-blush transition-colors">
          <ArrowLeft className="w-5 h-5 text-warm-gray" />
        </Link>
      </PageHeader>

      <div className="px-5">
        <AdminDashboard eventId={eventId} />
      </div>
    </main>
  );
}
