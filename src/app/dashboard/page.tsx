"use client";

import { useLayoutEffect } from "react";
import Link from "next/link";
import { CloudSyncBanner } from "@/components/admin/CloudSyncBanner";
import { MyEventsPanel } from "@/components/dashboard/MyEventsPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { cleanupAllEventsExceptDemo, seedDemoEvent, seedSampleUploads } from "@/lib/store";
import { DEMO_EVENT_ID, STUDIO_NAME } from "@/lib/constants";
import { ArrowLeft, Settings } from "lucide-react";

export default function AdminHomePage() {
  useLayoutEffect(() => {
    seedDemoEvent();
    void seedSampleUploads(DEMO_EVENT_ID);
    const params = new URLSearchParams(window.location.search);
    if (params.get("keep-sample-only") === "1") {
      cleanupAllEventsExceptDemo();
      void seedSampleUploads(DEMO_EVENT_ID, true);
      window.history.replaceState({}, "", "/dashboard");
    } else {
      void seedSampleUploads(DEMO_EVENT_ID);
    }
  }, []);

  return (
    <main className="min-h-dvh pb-8">
      <PageHeader
        title="Admin Dashboard"
        subtitle={`Wedding POV by ${STUDIO_NAME} — manage QR codes and guest access`}
      >
        <Link href="/" className="p-2 rounded-full hover:bg-blush transition-colors">
          <ArrowLeft className="w-5 h-5 text-warm-gray" />
        </Link>
      </PageHeader>

      <div className="px-5 space-y-4">
        <CloudSyncBanner />
        <div className="p-4 rounded-2xl bg-gradient-to-r from-charcoal to-black text-white border border-champagne/20 flex items-start gap-3">
          <Settings className="w-5 h-5 text-champagne shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-champagne">Admin only</p>
            <p className="text-sm text-white/70 mt-1">
              Guests never create events or enter codes — they scan your QR code, enter their name,
              and go straight to the camera.
            </p>
          </div>
          <Link
            href="/admin/print-center"
            className="shrink-0 px-4 py-2 rounded-full bg-champagne text-charcoal text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Print Center
          </Link>
        </div>
        <MyEventsPanel />
      </div>
    </main>
  );
}
