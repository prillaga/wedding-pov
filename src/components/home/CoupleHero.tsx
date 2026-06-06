"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TAGLINE } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { WeddingEvent } from "@/types";
import { Calendar, Heart, MapPin } from "lucide-react";

interface CoupleHeroProps {
  event: WeddingEvent;
  joinHref: string;
}

export function CoupleHero({ event, joinHref }: CoupleHeroProps) {
  const router = useRouter();
  const { settings, theme } = event;
  const coupleLabel = `${settings.groomName} & ${settings.brideName}`;

  const bgStyle: React.CSSProperties = theme.backgroundImage
    ? {
        backgroundImage: `url(${theme.backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background: `linear-gradient(160deg, ${theme.colors.secondary} 0%, ${theme.colors.primary} 50%, ${theme.colors.secondary} 100%)`,
      };

  return (
    <section className="relative min-h-dvh flex flex-col">
      <div className="absolute inset-0 pointer-events-none" style={bgStyle} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            theme.backgroundMode === "dark-overlay"
              ? "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.65) 100%)"
              : theme.backgroundMode === "blur"
                ? "rgba(255,255,255,0.15)"
                : "rgba(0,0,0,0.25)",
          backdropFilter: theme.backgroundMode === "blur" ? "blur(8px)" : undefined,
        }}
      />

      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 py-16 text-center safe-top">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="max-w-lg"
        >
          <p
            className="text-sm tracking-[0.3em] uppercase mb-6 opacity-80"
            style={{ color: theme.colors.accent }}
          >
            {settings.hashtag}
          </p>

          <h1
            className="text-5xl md:text-6xl font-semibold mb-4 leading-tight text-white"
            style={{ fontFamily: "var(--event-heading-font, Georgia, serif)" }}
          >
            {coupleLabel}
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-white/80 text-sm mb-6">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" style={{ color: theme.colors.accent }} />
              {formatDate(settings.weddingDate)}
            </span>
            <span className="hidden sm:inline opacity-40">·</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" style={{ color: theme.colors.accent }} />
              {settings.venue}
            </span>
          </div>

          <p className="text-white/70 text-base md:text-lg font-light mb-10 leading-relaxed">
            {TAGLINE}
          </p>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(joinHref)}
            className="inline-flex items-center justify-center gap-2 font-medium px-8 py-4 text-lg rounded-full min-w-[220px] cursor-pointer"
            style={{
              background: theme.colors.button,
              color: theme.preset === "black-gold" ? "#1A1A1A" : "#fff",
            }}
          >
            <Heart className="w-5 h-5" />
            Join Event
          </motion.button>

          {settings.welcomeMessage && (
            <p className="mt-8 text-white/50 text-sm max-w-md mx-auto leading-relaxed">
              {settings.welcomeMessage}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
