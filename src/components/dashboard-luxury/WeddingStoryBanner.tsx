"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEventStats } from "@/hooks/useEventStats";
import { formatStorageSize } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface WeddingStoryBannerProps {
  eventId: string;
  variant?: "compact" | "full";
}

export function WeddingStoryBanner({ eventId, variant = "full" }: WeddingStoryBannerProps) {
  const { stats } = useEventStats(eventId);

  const metrics = [
    { label: "Guests Joined", value: stats.totalGuests },
    { label: "Photos Uploaded", value: stats.totalUploads },
    { label: "Guest POVs", value: stats.guestPOVs },
    { label: "Storage Used", value: formatStorageSize(stats.storageUsedMB), isText: true },
  ];

  if (variant === "compact") {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="luxury-glass rounded-[24px] border border-champagne/15 luxury-shadow overflow-hidden"
      >
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-champagne" />
            <h2 className="font-serif text-lg text-charcoal">Wedding Story Progress</h2>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <span>
              <strong className="text-charcoal">{stats.totalGuests}</strong>{" "}
              <span className="text-warm-gray">Guests</span>
            </span>
            <span>
              <strong className="text-charcoal">{stats.totalUploads}</strong>{" "}
              <span className="text-warm-gray">Photos</span>
            </span>
            <span>
              <strong className="text-charcoal">{stats.guestPOVs}</strong>{" "}
              <span className="text-warm-gray">POVs</span>
            </span>
          </div>
          <p className="text-xs text-warm-gray mt-2 leading-relaxed">
            Every guest is helping create your wedding story.
          </p>
          <Link
            href={`/event/${eventId}/slideshow`}
            className="inline-flex items-center gap-2 mt-3 px-5 py-2 rounded-full bg-gradient-to-r from-champagne to-champagne-light text-white text-sm font-medium shadow-md hover:shadow-lg transition-shadow"
          >
            View Live Story →
          </Link>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[28px] border border-champagne/15 luxury-shadow"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-champagne/8 via-ivory to-blush/40" />
      <div className="absolute top-3 right-4 text-2xl opacity-[0.06] select-none">✿</div>
      <div className="absolute bottom-3 left-4 text-xl opacity-[0.05] select-none">❀</div>

      <div className="relative luxury-glass px-5 sm:px-6 py-5 sm:py-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-champagne animate-shimmer" />
          <h2 className="font-serif text-xl sm:text-2xl text-charcoal">Wedding Story Progress</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-2xl bg-white/60 border border-champagne/10 px-3 py-3 sm:px-4 sm:py-4 text-center"
            >
              <p className="font-serif text-2xl sm:text-3xl font-semibold text-charcoal tabular-nums">
                {m.isText ? m.value : m.value.toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-xs text-warm-gray mt-1 uppercase tracking-wider">
                {m.label}
              </p>
            </div>
          ))}
        </div>

        <p className="text-sm text-warm-gray mt-4 text-center leading-relaxed">
          Every guest is helping create your wedding story.
        </p>

        <div className="flex justify-center mt-4">
          <Link
            href={`/event/${eventId}/slideshow`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-champagne to-champagne-light text-white text-sm font-medium shadow-md hover:shadow-lg hover:gap-3 transition-all"
          >
            View Live Story
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
