"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { APP_NAME, TAGLINE } from "@/lib/constants";
import { cacheEventInSession, extractCfgParam, buildJoinPath } from "@/lib/event-bootstrap";
import { resolveEventInput } from "@/lib/event-utils";
import { Heart, QrCode, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const QRScanner = dynamic(() => import("@/components/qr/QRScanner"), { ssr: false });

export default function HomePage() {
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = (raw: string) => {
    const { eventId, embeddedEvent } = resolveEventInput(raw);
    if (!eventId) return;

    setShowScanner(false);

    if (embeddedEvent) {
      cacheEventInSession(embeddedEvent);
      router.push(buildJoinPath(eventId));
      return;
    }

    const cfg = extractCfgParam(raw);
    router.push(buildJoinPath(eventId, cfg ?? undefined));
  };

  return (
    <main className="min-h-screen-safe flex flex-col">
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-12 overflow-hidden safe-top">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-blush/60 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-champagne-light/30 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-md"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blush mb-6">
            <Heart className="w-8 h-8 text-champagne fill-champagne/30" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-charcoal leading-tight">
            {APP_NAME}
          </h1>
          <p className="text-warm-gray mt-3 text-base leading-relaxed">{TAGLINE}</p>
          <p className="text-sm text-warm-gray/90 mt-4 leading-relaxed">
            Scan the QR code on your wedding invitation to join and start taking photos.
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
          <Button variant="gold" size="lg" className="w-full" onClick={() => setShowScanner(true)}>
            <QrCode className="w-5 h-5" />
            Scan Invitation QR Code
          </Button>

          <p className="text-center text-xs text-warm-gray px-2">
            No account or setup needed — scan, enter your name, and the camera opens.
          </p>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 text-xs text-warm-gray hover:text-champagne transition-colors pt-2"
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
