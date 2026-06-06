"use client";

import { useLayoutEffect } from "react";
import Link from "next/link";
import { CreateWeddingEventForm } from "@/components/dashboard/CreateWeddingEventForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { seedDemoEvent } from "@/lib/store";
import { ArrowLeft } from "lucide-react";

export default function CreateEventPage() {
  useLayoutEffect(() => {
    seedDemoEvent();
  }, []);

  return (
    <main className="min-h-dvh pb-8">
      <PageHeader title="Create Wedding Event" subtitle="One setup — automatic QR code & guest link">
        <Link href="/dashboard" className="p-2 rounded-full hover:bg-blush transition-colors">
          <ArrowLeft className="w-5 h-5 text-warm-gray" />
        </Link>
      </PageHeader>

      <div className="px-5">
        <CreateWeddingEventForm />
      </div>
    </main>
  );
}
