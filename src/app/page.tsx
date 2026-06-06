"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { APP_NAME, DEMO_EVENT_ID, TAGLINE } from "@/lib/constants";
import { seedDemoEvent } from "@/lib/store";
import { Camera, Heart, QrCode, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

const QRScanner = dynamic(
  () => import("@/components/qr/QRScanner").then((m) => m.QRScanner),
  { ssr: false }
);

export default function HomePage() {
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);
  const [eventCode, setEventCode] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    seedDemoEvent();
    setMounted(true);
  }, []);

  const handleScan = (eventId: string) => {
    setShowScanner(false);
    router.push(`/wedding/${eventId}`);
  };

  const handleManualJoin = () => {
    const code = eventCode.trim() || DEMO_EVENT_ID;
    router.push(`/wedding/${code}`);
  };

  if (!mounted) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <p className="text-warm-gray">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex flex-col">
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-hidden">
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
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-charcoal leading-tight">
            {APP_NAME}
          </h1>
          <p className="text-warm-gray mt-3 text-base leading-relaxed">{TAGLINE}</p>
          <p className="text-champagne text-sm mt-1">👰🤵📸✨</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 grid grid-cols-3 gap-4 mt-10 max-w-sm w-full"
        >
          {[
            { icon: <QrCode className="w-5 h-5" />, label: "Scan QR" },
            { icon: <Camera className="w-5 h-5" />, label: "Capture POV" },
            { icon: <Sparkles className="w-5 h-5" />, label: "Live Story" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/70 border border-white/40 wedding-shadow"
            >
              <span className="text-champagne">{item.icon}</span>
              <span className="text-xs text-warm-gray font-medium">{item.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      <section className="px-6 pb-8 safe-bottom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-md mx-auto space-y-4"
        >
          <Button variant="gold" size="lg" className="w-full" onClick={() => setShowScanner(true)}>
            <QrCode className="w-5 h-5" />
            Scan Invitation QR Code
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-champagne/20" />
            <span className="text-xs text-warm-gray">or</span>
            <div className="flex-1 h-px bg-champagne/20" />
          </div>

          <div className="flex gap-2">
            <input
              value={eventCode}
              onChange={(e) => setEventCode(e.target.value)}
              placeholder="Enter event code"
              className="flex-1 px-4 py-3 rounded-full border border-champagne/20 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-champagne/40"
            />
            <Button variant="secondary" onClick={handleManualJoin}>
              Join
            </Button>
          </div>

          <p className="text-center text-xs text-warm-gray">
            Demo:{" "}
            <button
              onClick={() => router.push(`/wedding/${DEMO_EVENT_ID}`)}
              className="text-champagne hover:underline"
            >
              {DEMO_EVENT_ID}
            </button>
          </p>

          <Link
            href={`/dashboard/${DEMO_EVENT_ID}`}
            className="block text-center text-xs text-warm-gray hover:text-champagne transition-colors"
          >
            Couple Dashboard →
          </Link>
        </motion.div>
      </section>

      {showScanner && <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
    </main>
  );
}
