"use client";

import { useLayoutEffect, useMemo, useState } from "react";
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
  const [seeded, setSeeded] = useState(false);

  useLayoutEffect(() => {
    seedDemoEvent();
    setSeeded(true);
  }, []);

  const event = useMemo(() => (seeded ? getEvent(eventId) ?? null : null), [seeded, eventId]);

  if (!seeded) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <p className="text-warm-gray">Loading event...</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6 text-center">
        <div>
          <p className="font-serif text-xl mb-2">Event not found</p>
          <Link href="/dashboard" className="text-champagne underline">
            Back to My Events
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh pb-8">
      <PageHeader
        title="Event Dashboard"
        subtitle={`${event.coupleName} — Manage your wedding`}
      >
        <Link href="/dashboard" className="p-2 rounded-full hover:bg-blush transition-colors">
          <ArrowLeft className="w-5 h-5 text-warm-gray" />
        </Link>
      </PageHeader>

      <div className="px-5">
        <AdminDashboard eventId={eventId} />
      </div>
    </main>
  );
}
