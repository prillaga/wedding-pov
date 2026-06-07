"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { APP_NAME, DEMO_EVENT_ID, TAGLINE } from "@/lib/constants";
import { cacheEventInSession, buildJoinPath } from "@/lib/event-bootstrap";
import { isDemoEventId } from "@/lib/demo-event";
import { lookupRemoteEventByCode, fetchRemoteEvent } from "@/lib/event-remote";
import {
  findLocalEventIdByShortCode,
  resolveEventInput,
} from "@/lib/event-utils";
import { resolveEventIdAlias } from "@/lib/public-events";
import { getEvents } from "@/lib/store";
import { ChevronDown, Heart, QrCode, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const QRScanner = dynamic(() => import("@/components/qr/QRScanner"), { ssr: false });

export default function HomePage() {
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const [eventCode, setEventCode] = useState("");
  const [manualError, setManualError] = useState("");
  const [joining, setJoining] = useState(false);

  const goToEvent = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setManualError("Enter an event code or paste your invitation link.");
      return;
    }

    setJoining(true);
    setManualError("");
    setShowScanner(false);

    const { eventId, embeddedEvent } = resolveEventInput(trimmed);

    if (embeddedEvent) {
      cacheEventInSession(embeddedEvent);
      router.push(buildJoinPath(eventId));
      setJoining(false);
      return;
    }

    if (!eventId) {
      setManualError("Enter an event code or paste your invitation link.");
      setJoining(false);
      return;
    }

    const localShortId = findLocalEventIdByShortCode(trimmed, getEvents());
    const lookup = await lookupRemoteEventByCode(trimmed);
    if (lookup) {
      cacheEventInSession(lookup);
      router.push(buildJoinPath(lookup.id));
      setJoining(false);
      return;
    }

    const resolvedId = localShortId ?? resolveEventIdAlias(eventId);
    const remote = await fetchRemoteEvent(resolvedId);
    if (remote) {
      cacheEventInSession(remote);
      router.push(buildJoinPath(remote.id));
      setJoining(false);
      return;
    }

    if (isDemoEventId(resolvedId)) {
      router.push(buildJoinPath(DEMO_EVENT_ID));
      setJoining(false);
      return;
    }

    setManualError(
      `Event "${trimmed}" not found. Double-check the code, or ask your host to tap Sync Now in the Admin Dashboard.`
    );
    setJoining(false);
  };

  const handleScan = (raw: string) => {
    void goToEvent(raw);
  };

  return (
    <main className="min-h-screen-safe flex flex-col luxury-page-bg">
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-12 overflow-hidden safe-top">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-blush/60 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-champagne-light/30 blur-3xl" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-[120px] opacity-[0.03] select-none">✿</div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-md"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blush to-champagne/20 mb-6 luxury-shadow">
            <Heart className="w-8 h-8 text-champagne fill-champagne/30" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-charcoal leading-tight">
            {APP_NAME}
          </h1>
          <p className="text-warm-gray mt-3 text-base leading-relaxed">{TAGLINE}</p>
          <p className="text-sm text-champagne/80 mt-2 font-medium tracking-wide">
            One QR Code. Hundreds of Perspectives. One Beautiful Story.
          </p>
        </motion.div>
      </section>

      <section className="px-4 sm:px-6 pb-6 sm:pb-8 safe-bottom safe-x">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-md mx-auto space-y-4"
        >
          <Button variant="gold" size="lg" className="w-full shadow-lg" onClick={() => setShowScanner(true)}>
            <QrCode className="w-5 h-5" />
            Scan Invitation QR Code
          </Button>

          <button
            type="button"
            onClick={() => setShowCodeEntry((v) => !v)}
            className="w-full flex items-center justify-center gap-2 text-sm text-warm-gray hover:text-champagne transition-colors py-2"
          >
            Have an Event Code?
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showCodeEntry ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {showCodeEntry && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-2"
              >
                <input
                  value={eventCode}
                  onChange={(e) => {
                    setEventCode(e.target.value);
                    setManualError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && void goToEvent(eventCode)}
                  placeholder="Event code (e.g. JJ2027), link, or event ID"
                  className="w-full px-4 py-3 rounded-full border border-champagne/20 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-champagne/40 luxury-shadow"
                />
                {manualError && <p className="text-xs text-red-500 text-center">{manualError}</p>}
                <Button
                  variant="secondary"
                  className="w-full"
                  loading={joining}
                  onClick={() => void goToEvent(eventCode)}
                >
                  Join Event
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-warm-gray px-2 leading-relaxed">
            No account needed — scan your invitation, add your name, and the camera opens instantly.
          </p>

          <p className="text-center text-xs text-warm-gray">
            Demo:{" "}
            <button
              type="button"
              onClick={() => void goToEvent(DEMO_EVENT_ID)}
              className="text-champagne hover:underline"
            >
              {DEMO_EVENT_ID}
            </button>
          </p>

          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 text-xs text-warm-gray hover:text-champagne transition-colors"
          >
            View Pricing
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 text-xs text-warm-gray hover:text-champagne transition-colors pt-1"
          >
            <Settings className="w-3.5 h-3.5" />
            Admin Dashboard
          </Link>
        </motion.div>
      </section>

      {showScanner && <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
    </main>
  );
}
