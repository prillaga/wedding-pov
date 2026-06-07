"use client";

import Link from "next/link";
import { Camera, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SlideshowEmptyStateProps {
  displayMode?: boolean;
  fullscreen?: boolean;
  cameraHref?: string;
}

export function SlideshowEmptyState({ displayMode, fullscreen, cameraHref }: SlideshowEmptyStateProps) {
  const isImmersive = displayMode || fullscreen;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-8 ${
        isImmersive
          ? "h-screen bg-charcoal"
          : "h-64 sm:h-72 rounded-[28px] bg-gradient-to-br from-blush/80 to-ivory border border-champagne/10"
      }`}
    >
      <Sparkles
        className={`mb-4 ${isImmersive ? "w-10 h-10 text-champagne/40" : "w-8 h-8 text-champagne/50"}`}
      />
      <p
        className={`font-serif ${isImmersive ? "text-2xl text-ivory/70" : "text-xl text-charcoal"}`}
      >
        {isImmersive ? "Waiting for guest photos…" : "No Memories Yet"}
      </p>
      <p
        className={`mt-2 max-w-xs leading-relaxed ${
          isImmersive ? "text-ivory/40 text-sm" : "text-warm-gray text-sm"
        }`}
      >
        {isImmersive
          ? "As guests upload moments, they'll appear here automatically — no refresh needed."
          : "Be the first guest to share a wedding moment."}
      </p>
      {cameraHref && !isImmersive && (
        <Link href={cameraHref} className="mt-5">
          <Button variant="gold" size="md">
            <Camera className="w-4 h-4" />
            Open Camera
          </Button>
        </Link>
      )}
    </div>
  );
}

export function SlideshowSkeleton({ displayMode, fullscreen }: SlideshowEmptyStateProps) {
  return (
    <div
      className={`relative overflow-hidden animate-pulse ${
        displayMode || fullscreen
          ? "h-screen w-screen bg-charcoal"
          : "rounded-[28px] aspect-[16/10] bg-charcoal/80 wedding-shadow"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-warm-gray/20 to-charcoal" />
      <div className="absolute bottom-6 left-6 right-6 space-y-3">
        <div className="h-6 w-48 rounded-full bg-white/10" />
        <div className="h-4 w-32 rounded-full bg-white/10" />
        <div className="h-3 w-24 rounded-full bg-champagne/20" />
      </div>
      <p className="absolute inset-0 flex items-center justify-center text-ivory/30 text-sm font-serif">
        Loading wedding memories…
      </p>
    </div>
  );
}
