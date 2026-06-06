"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { TAGLINE, DEFAULT_HERO } from "@/lib/constants";
import {
  getContentBackdropStyle,
  getCoupleLabel,
  getHeroBackgroundStyle,
  getHeroOverlayStyle,
  getInvitationWrapperClass,
  getTextShadowStyle,
  resolveHeroImage,
} from "@/lib/hero-styles";
import { formatDate } from "@/lib/utils";
import type { WeddingEvent } from "@/types";
import { Calendar, Heart, MapPin } from "lucide-react";

interface HeroBannerRendererProps {
  event: WeddingEvent;
  compact?: boolean;
  preview?: boolean;
  showJoinButton?: boolean;
  onJoinClick?: () => void;
  joinButtonLabel?: string;
  children?: ReactNode;
}

export function HeroBannerRenderer({
  event,
  compact = false,
  preview = false,
  showJoinButton = true,
  onJoinClick,
  joinButtonLabel = "Join Event",
  children,
}: HeroBannerRendererProps) {
  const { settings, theme } = event;
  const hero = theme?.hero ?? DEFAULT_HERO;
  const coupleLabel = getCoupleLabel(event);
  const [bgIndex, setBgIndex] = useState(0);

  const images = hero.backgroundImages ?? [];
  const useSlideshow =
    hero.layout === "slideshow" ||
    hero.backgroundSlideshow ||
    theme.backgroundMode === "slideshow";

  useEffect(() => {
    if (!useSlideshow || images.length < 2) return;
    const timer = setInterval(() => {
      setBgIndex((i) => (i + 1) % images.length);
    }, hero.slideshowInterval ?? 6000);
    return () => clearInterval(timer);
  }, [useSlideshow, images, hero.slideshowInterval]);

  const heroImage = resolveHeroImage(theme, hero, bgIndex);
  const bgStyle = getHeroBackgroundStyle(theme, hero, heroImage);
  const overlayStyle = getHeroOverlayStyle(hero);
  const textShadow = getTextShadowStyle(hero.textShadow ?? true);
  const contentBackdrop = getContentBackdropStyle(hero.textBackdropBlur);
  const invitationClass = getInvitationWrapperClass(hero.invitationStyle ?? "none");
  const tc = hero.textColors ?? {
    hashtag: "#C9A962",
    title: "#FFFFFF",
    date: "#FFFFFF",
    tagline: "#FFFFFF",
    button: "#C9A962",
    buttonText: "#FFFFFF",
  };

  const isSplit = hero.layout === "split-left";
  const isInvitation = hero.layout === "invitation-center" || hero.invitationStyle !== "none";

  const heroContent = (
    <motion.div
      initial={{ opacity: 1, y: preview ? 0 : compact ? 12 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: preview ? 0 : 0.8 }}
      className={`w-full ${isSplit ? "max-w-md lg:max-w-lg text-left" : "max-w-lg text-center mx-auto"} ${invitationClass}`}
      style={contentBackdrop}
    >
      <p
        className={`tracking-[0.3em] uppercase mb-4 md:mb-6 opacity-90 ${compact ? "text-[10px]" : "text-sm"}`}
        style={{ color: tc.hashtag, ...textShadow }}
      >
        {settings.hashtag}
      </p>

      <h1
        className={`font-semibold mb-3 md:mb-4 leading-tight break-words ${compact ? "text-2xl" : "text-3xl sm:text-4xl md:text-5xl lg:text-6xl"}`}
        style={{
          color: tc.title,
          fontFamily: "var(--event-heading-font, Georgia, serif)",
          ...textShadow,
        }}
      >
        {coupleLabel}
      </h1>

      <div
        className={`flex ${isSplit ? "flex-col items-start" : "flex-col sm:flex-row items-center justify-center"} gap-2 sm:gap-4 text-sm mb-4 md:mb-6`}
        style={{ color: tc.date, opacity: 0.9, ...textShadow }}
      >
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" style={{ color: tc.hashtag }} />
          {formatDate(settings.weddingDate)}
        </span>
        {!isSplit && <span className="hidden sm:inline opacity-40">·</span>}
        <span className="flex items-center gap-1.5 max-w-full break-words text-center sm:text-left">
          <MapPin className="w-4 h-4 shrink-0" style={{ color: tc.hashtag }} />
          <span className="min-w-0">{settings.venue}</span>
        </span>
      </div>

      <p
        className={`font-light mb-6 md:mb-10 leading-relaxed ${compact ? "text-xs" : "text-base md:text-lg"}`}
        style={{ color: tc.tagline, opacity: 0.85, ...textShadow }}
      >
        {TAGLINE}
      </p>

      {showJoinButton && onJoinClick && (
        <button
          type="button"
          onClick={onJoinClick}
          className={`inline-flex items-center justify-center gap-2 font-medium rounded-full cursor-pointer relative z-50 touch-target ${
            compact
              ? "px-5 py-2.5 text-sm min-w-[160px]"
              : "px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg w-full max-w-[280px] sm:max-w-none sm:min-w-[220px]"
          } ${isSplit ? "" : "mx-auto"}`}
          style={{
            background: tc.button,
            color: tc.buttonText,
            ...textShadow,
          }}
        >
          <Heart className={compact ? "w-4 h-4" : "w-5 h-5"} />
          {joinButtonLabel}
        </button>
      )}

      {settings.welcomeMessage && !compact && (
        <p
          className="mt-6 md:mt-8 text-sm max-w-md leading-relaxed"
          style={{
            color: tc.tagline,
            opacity: 0.55,
            ...textShadow,
            marginLeft: isSplit ? 0 : "auto",
            marginRight: isSplit ? undefined : "auto",
          }}
        >
          {settings.welcomeMessage}
        </p>
      )}
    </motion.div>
  );

  const sectionHeight = preview
    ? "h-full min-h-[400px]"
    : compact
      ? "min-h-[420px] rounded-[2rem]"
      : "min-h-screen-safe";

  return (
    <section
      className={`relative flex flex-col overflow-hidden ${sectionHeight}`}
      style={{ background: theme.screenBackgrounds?.homepage ?? theme.colors.primary }}
    >
      {hero.layout === "video-background" && hero.videoBackgroundUrl ? (
        <video
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          src={hero.videoBackgroundUrl}
          autoPlay
          muted
          loop
          playsInline
          style={{
            filter: hero.brightness !== 100 ? `brightness(${hero.brightness}%)` : undefined,
          }}
        />
      ) : (
        <div className="absolute inset-0 pointer-events-none transition-all duration-700" style={bgStyle} />
      )}

      <div className="absolute inset-0 pointer-events-none" style={overlayStyle} />

      <div
        className={`relative z-30 flex-1 flex w-full ${
          isSplit
            ? "flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 px-4 sm:px-6 py-10 sm:py-12 safe-x"
            : "flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-16 text-center safe-top safe-bottom safe-x touch-scroll-y"
        }`}
      >
        {isSplit && heroImage && (
          <div
            className="hidden lg:block w-full max-w-md aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 shrink-0"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundSize: `${hero.imageZoom}%`,
              backgroundPosition: `${hero.imagePosition.x}% ${hero.imagePosition.y}%`,
              filter: hero.brightness !== 100 ? `brightness(${hero.brightness}%)` : undefined,
            }}
          />
        )}

        {heroContent}
      </div>

      {children ? <div className="absolute inset-0 z-40">{children}</div> : null}
    </section>
  );
}
