"use client";

import { motion } from "framer-motion";
import { getGuestUploadQuota } from "@/lib/photo-limits";
import { getAllUploadsForQuota, getEvent } from "@/lib/store";
import { formatGuestPOV } from "@/lib/utils";
import type { Guest } from "@/types";
import { Heart, Sparkles } from "lucide-react";

interface GuestContributionTrackerProps {
  eventId: string;
  guest: Guest;
}

export function GuestContributionTracker({ eventId, guest }: GuestContributionTrackerProps) {
  const event = getEvent(eventId);
  const quota = getGuestUploadQuota(
    event?.photoLimits ?? {
      enabled: true,
      type: "total",
      maxPhotos: 10,
      limitReachedBehavior: "block",
    },
    getAllUploadsForQuota(eventId),
    guest.id
  );

  const pct =
    quota.max && quota.max > 0
      ? Math.min(100, (quota.used / quota.max) * 100)
      : 0;
  const filled = Math.round(pct / 10);

  if (!quota.isLimited || quota.max === null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="luxury-glass rounded-[28px] p-6 border border-champagne/15"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-champagne" />
          <p className="text-xs uppercase tracking-[0.2em] text-warm-gray">Your Wedding Memories</p>
        </div>
        <p className="font-serif text-xl text-charcoal">{formatGuestPOV(guest)}</p>
        <p className="text-sm text-warm-gray mt-1">{quota.used} photos shared · Unlimited uploads</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`luxury-glass rounded-[28px] p-6 border ${
        quota.isAtLimit ? "border-blush-deep/40 bg-blush/20" : "border-champagne/15"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Heart className={`w-4 h-4 ${quota.isAtLimit ? "text-blush-deep fill-blush-deep/30" : "text-champagne fill-champagne/20"}`} />
        <p className="text-xs uppercase tracking-[0.2em] text-warm-gray">Your Wedding Memories</p>
      </div>

      <p className="font-serif text-xl text-charcoal mb-1">{formatGuestPOV(guest)}</p>
      <p className="text-sm text-charcoal/80 mb-4">
        <span className="font-semibold text-champagne">{quota.used}</span>
        {" / "}
        {quota.max} Photos Uploaded
      </p>

      <div className="h-2 rounded-full bg-champagne/10 overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${
            quota.isAtLimit
              ? "bg-gradient-to-r from-blush-deep to-rose-300"
              : "bg-gradient-to-r from-champagne via-champagne-light to-champagne"
          }`}
        />
      </div>

      <p className="text-[10px] font-mono tracking-wider text-warm-gray mb-3">
        {"█".repeat(filled)}
        {"░".repeat(10 - filled)}
      </p>

      {quota.isAtLimit ? (
        <div className="rounded-2xl bg-white/60 border border-blush-deep/20 px-4 py-3 text-center">
          <p className="font-serif text-base text-charcoal">Photo Limit Reached</p>
          <p className="text-xs text-warm-gray mt-1 leading-relaxed">
            You have contributed the maximum number of photos for this event.
            <br />
            Thank you for helping tell the wedding story.
          </p>
        </div>
      ) : (
        <p className="text-sm text-warm-gray">
          Remaining:{" "}
          <span className="font-medium text-champagne">{quota.remaining}</span> Photo
          {quota.remaining === 1 ? "" : "s"}
        </p>
      )}
    </motion.div>
  );
}
