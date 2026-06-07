"use client";

import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { GuestContributionTracker } from "@/components/dashboard-luxury/GuestContributionTracker";
import { HowItWorksSection } from "@/components/dashboard-luxury/HowItWorksSection";
import { LuxuryFeatureCard } from "@/components/dashboard-luxury/LuxuryFeatureCard";
import { LuxuryHeroBanner } from "@/components/dashboard-luxury/LuxuryHeroBanner";
import { WeddingStoryBanner } from "@/components/dashboard-luxury/WeddingStoryBanner";
import { BottomNav } from "@/components/layout/BottomNav";
import { LiveSlideshow } from "@/components/slideshow/LiveSlideshow";
import { SlideshowEmptyState } from "@/components/slideshow/SlideshowStates";
import { EventThemeProvider } from "@/components/theme/EventThemeProvider";
import { Button } from "@/components/ui/Button";
import { useEventPhotos } from "@/hooks/useEventPhotos";
import {
  getGuest,
  getSession,
  loadEventForGuest,
  seedSampleUploads,
} from "@/lib/store";
import { formatGuestNamePOV } from "@/lib/utils";
import type { Guest, WeddingEvent } from "@/types";
import { Camera, Sparkles } from "lucide-react";

export default function EventHomePage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { photos: slideshowPhotos, loading: slideshowLoading, refresh: refreshPhotos } =
    useEventPhotos(eventId, {
      pollIntervalMs: 3000,
    });
  const [event, setEvent] = useState<WeddingEvent | null | undefined>(undefined);
  const [guest, setGuest] = useState<(Guest & { eventId?: string }) | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    void loadEventForGuest(eventId).then((loaded) => {
      if (cancelled) return;
      if (loaded) seedSampleUploads(eventId);
      setEvent(loaded);
      const session = getSession();
      setGuest(session ? getGuest(session.guestId) ?? null : null);
      refreshPhotos();
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, refreshPhotos]);

  if (event === undefined) {
    return (
      <main className="min-h-dvh flex items-center justify-center luxury-page-bg">
        <p className="font-serif text-warm-gray animate-pulse">Opening your invitation…</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-dvh flex items-center justify-center luxury-page-bg px-6 text-center">
        <p className="font-serif text-warm-gray">Event not found</p>
      </main>
    );
  }

  const features = [
    {
      href: `/event/${eventId}/camera`,
      emoji: "📸",
      title: "Take Photo",
      description: "Capture your POV",
      buttonLabel: "Open Camera",
      gradient: "from-champagne to-champagne-light",
      featured: true,
    },
    {
      href: `/event/${eventId}/gallery`,
      emoji: "🖼",
      title: "Gallery",
      description: "View all guest memories",
      buttonLabel: "View Gallery",
      gradient: "from-blush to-blush-deep",
    },
    {
      href: `/event/${eventId}/slideshow`,
      emoji: "🎞",
      title: "Slideshow",
      description: "Watch the live wedding story",
      buttonLabel: "Watch Slideshow",
      gradient: "from-charcoal/80 to-warm-gray",
    },
    {
      href: `/event/${eventId}/display`,
      emoji: "📺",
      title: "TV Display",
      description: "Reception display mode",
      buttonLabel: "Start Display",
      gradient: "from-champagne/70 to-rose-gold/40",
    },
  ];

  const hasPhotos = slideshowPhotos.length > 0;

  return (
    <EventThemeProvider event={event}>
      <main className="min-h-screen-safe pb-24 sm:pb-28 luxury-page-bg relative overflow-x-hidden">
        <div className="absolute inset-0 luxury-sparkles pointer-events-none opacity-60" />
        <div className="absolute top-20 -left-10 text-6xl opacity-[0.04] select-none">✿</div>
        <div className="absolute bottom-40 -right-8 text-5xl opacity-[0.04] select-none">❀</div>

        <LuxuryHeroBanner event={event} guest={guest} />

        <div className="px-4 sm:px-5 space-y-8 mt-6 relative z-10">
          <WeddingStoryBanner eventId={eventId} variant="full" />

          {guest && (
            <GuestContributionTracker eventId={eventId} guest={guest} />
          )}

          {!hasPhotos && !slideshowLoading && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="luxury-glass rounded-[28px] border border-champagne/12 p-6 sm:p-8 text-center luxury-shadow"
            >
              <div className="text-4xl mb-4">📷</div>
              <h2 className="font-serif text-2xl text-charcoal">No Memories Yet</h2>
              <p className="text-sm text-warm-gray mt-2 leading-relaxed max-w-xs mx-auto">
                Be the first guest to share a wedding moment.
              </p>
              <Link href={`/event/${eventId}/camera`} className="inline-block mt-5">
                <Button variant="gold" size="lg">
                  <Camera className="w-5 h-5" />
                  Open Camera
                </Button>
              </Link>
            </motion.section>
          )}

          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="font-serif text-xl sm:text-2xl text-charcoal">Your Experience</h2>
              <span className="text-[10px] uppercase tracking-[0.2em] text-champagne">Wedding POV</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {features.map((f, i) => (
                <LuxuryFeatureCard key={f.href} {...f} delay={i * 0.08} />
              ))}
            </div>
          </section>

          <HowItWorksSection />

          <section className="luxury-glass rounded-[28px] border border-champagne/12 overflow-hidden luxury-shadow">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-champagne" />
                <h2 className="font-serif text-lg">Live Slideshow</h2>
              </div>
              <Link
                href={`/event/${eventId}/slideshow`}
                className="text-xs text-champagne hover:underline font-medium"
              >
                Full screen →
              </Link>
            </div>
            <div className="rounded-b-[28px] overflow-hidden">
              {hasPhotos || slideshowLoading ? (
                <LiveSlideshow
                  uploads={slideshowPhotos}
                  loading={slideshowLoading}
                  style={event.slideshow?.style ?? "fade"}
                  interval={event.slideshow?.transitionDuration ?? 3000}
                  intro={event.slideshow?.intro}
                  outro={event.slideshow?.outro}
                  showTimestamp={event.slideshow?.showTimestamp ?? true}
                  showGuestNames={event.slideshow?.showGuestNames ?? true}
                  music={event.slideshow?.music}
                  musicEnabled={event.slideshow?.music?.enabled}
                  loop
                  autoPlay
                />
              ) : (
                <SlideshowEmptyState cameraHref={`/event/${eventId}/camera`} />
              )}
            </div>
          </section>

          {hasPhotos && (
            <section>
              <h2 className="font-serif text-lg mb-4 px-1">Recent POVs</h2>
              <div className="flex gap-3 touch-scroll-x pb-2 -mx-1 px-1">
                {[...slideshowPhotos].reverse().slice(0, 8).map((upload, i) => (
                  <motion.div
                    key={upload.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="shrink-0 w-28 rounded-[20px] overflow-hidden luxury-shadow border border-champagne/10"
                  >
                    <img
                      src={upload.imageData}
                      alt=""
                      className="w-full aspect-square object-cover"
                    />
                    <p className="text-[10px] text-center py-2 text-warm-gray truncate px-2 bg-white/80">
                      {formatGuestNamePOV(upload.guestName)}
                    </p>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>

        <BottomNav eventId={eventId} />
      </main>
    </EventThemeProvider>
  );
}
