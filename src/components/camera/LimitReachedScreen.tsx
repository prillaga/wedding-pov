"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { getLimitNotification } from "@/lib/constants";
import type { GuestUploadQuota, PhotoLimitValue } from "@/types";
import { CameraOff, Heart, Grid3X3, Play } from "lucide-react";
import Link from "next/link";

interface LimitReachedScreenProps {
  eventId: string;
  guestName: string;
  quota: GuestUploadQuota;
  maxPhotos?: PhotoLimitValue;
  onBack?: () => void;
}

export function LimitReachedScreen({
  eventId,
  guestName,
  quota,
  maxPhotos,
  onBack,
}: LimitReachedScreenProps) {
  const limitMsg =
    maxPhotos && maxPhotos !== "unlimited"
      ? getLimitNotification(maxPhotos)
      : `You have uploaded ${quota.used} of ${quota.max} photos.`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8 text-center"
      style={{ background: "var(--event-primary, #FFFEF9)" }}
    >
      <div className="max-w-sm w-full">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
          style={{ background: "var(--event-secondary, #F5E6E0)" }}
        >
          <CameraOff className="w-8 h-8" style={{ color: "var(--event-accent, #C9A962)" }} />
        </div>

        <h1
          className="font-serif text-3xl font-semibold mb-2"
          style={{ color: "var(--event-text, #2C2C2C)", fontFamily: "var(--event-heading-font)" }}
        >
          Photo Limit Reached
        </h1>

        <p className="text-warm-gray mb-6 leading-relaxed">{limitMsg}</p>

        <div className="flex items-center justify-center gap-2 text-champagne mb-8">
          <Heart className="w-4 h-4 fill-champagne/30" />
          <p className="font-serif italic">Please enjoy the event.</p>
          <Heart className="w-4 h-4 fill-champagne/30" />
        </div>

        <p className="text-sm text-warm-gray mb-6">
          Thank you for contributing, {guestName.split(" ")[0]}.
          <br />
          Your POV memories are part of the wedding story.
        </p>

        <div className="space-y-3">
          <Link href={`/event/${eventId}/gallery`} className="block">
            <Button variant="gold" className="w-full">
              <Grid3X3 className="w-4 h-4" /> View Gallery
            </Button>
          </Link>
          <Link href={`/event/${eventId}/slideshow`} className="block">
            <Button variant="secondary" className="w-full">
              <Play className="w-4 h-4" /> Watch Slideshow
            </Button>
          </Link>
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="w-full text-warm-gray">
              Back to Event
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
