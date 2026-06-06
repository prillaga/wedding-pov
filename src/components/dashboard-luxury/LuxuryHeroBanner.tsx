"use client";

import { motion } from "framer-motion";
import { TAGLINE } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { Guest, WeddingEvent } from "@/types";
import { Calendar, Sparkles } from "lucide-react";
import { POVBadge } from "@/components/layout/PageHeader";

interface LuxuryHeroBannerProps {
  event: WeddingEvent;
  guest?: Guest | null;
}

function getMonogram(event: WeddingEvent): string {
  const g = event.settings.groomName?.[0] ?? "J";
  const b = event.settings.brideName?.[0] ?? "J";
  return `${g} · ${b}`;
}

export function LuxuryHeroBanner({ event, guest }: LuxuryHeroBannerProps) {
  const { settings, theme } = event;
  const coupleLabel = `${settings.groomName} & ${settings.brideName}`;
  const heroImage =
    theme.hero?.couplePhoto ?? theme.backgroundImage;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative mx-4 mt-4 rounded-[32px] overflow-hidden luxury-shadow min-h-[280px]"
    >
      {/* Background layers */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.primary} 45%, ${theme.colors.secondary} 100%)`,
        }}
      />
      <div className="absolute inset-0 luxury-fabric opacity-40" />
      <div className="absolute inset-0 luxury-sparkles pointer-events-none" />

      {/* Floral corners */}
      <div className="absolute top-3 left-3 text-2xl opacity-30 select-none">✿</div>
      <div className="absolute top-3 right-3 text-2xl opacity-30 select-none rotate-90">✿</div>
      <div className="absolute bottom-3 left-3 text-xl opacity-20 select-none">❀</div>
      <div className="absolute bottom-3 right-24 text-xl opacity-20 select-none">❀</div>

      <div className="relative z-10 flex flex-col sm:flex-row min-h-[280px]">
        {/* Left: copy */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-champagne/40 bg-white/30 backdrop-blur-sm mb-4">
            <span className="font-serif text-lg text-champagne tracking-widest">
              {getMonogram(event)}
            </span>
          </div>

          <p className="text-[10px] uppercase tracking-[0.35em] text-champagne mb-2">
            {settings.hashtag}
          </p>

          <h1
            className="font-serif text-3xl sm:text-4xl font-semibold text-charcoal leading-tight"
            style={{ fontFamily: "var(--event-heading-font, Georgia, serif)" }}
          >
            {coupleLabel}
          </h1>

          <p className="text-sm text-warm-gray mt-2 italic">Collaborative Wedding Story</p>

          <div className="flex items-center gap-2 mt-3 text-sm text-warm-gray">
            <Calendar className="w-4 h-4 text-champagne shrink-0" />
            <span>{formatDate(settings.weddingDate)}</span>
          </div>

          {guest && (
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full luxury-glass border border-champagne/20 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-champagne" />
              <POVBadge name={`${guest.firstName} ${guest.lastName}`} size="sm" />
            </div>
          )}

          <p className="text-xs text-warm-gray/80 mt-4 max-w-xs leading-relaxed hidden sm:block">
            {TAGLINE}
          </p>
        </div>

        {/* Right: couple photo */}
        <div className="relative w-full sm:w-[42%] min-h-[180px] sm:min-h-0">
          {heroImage ? (
            <img
              src={heroImage}
              alt={coupleLabel}
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                objectPosition: `${theme.hero?.imagePosition?.x ?? 50}% ${theme.hero?.imagePosition?.y ?? 50}%`,
              }}
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `linear-gradient(160deg, ${theme.colors.accent}33, ${theme.colors.secondary})`,
              }}
            >
              <span className="font-serif text-6xl text-champagne/25">{getMonogram(event)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white/20 sm:bg-gradient-to-r sm:from-white/30 sm:via-transparent sm:to-transparent" />
          <div className="absolute inset-0 ring-1 ring-inset ring-champagne/10 rounded-none sm:rounded-r-[32px]" />
        </div>
      </div>
    </motion.section>
  );
}
