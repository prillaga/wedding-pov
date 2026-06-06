import type { CSSProperties } from "react";
import type { HeroSettings, ThemeSettings, WeddingEvent } from "@/types";

export function resolveHeroImage(
  theme: ThemeSettings,
  hero: HeroSettings,
  slideshowIndex = 0
): string | undefined {
  if (hero.layout === "slideshow" || hero.backgroundSlideshow) {
    const images = hero.backgroundImages ?? [];
    if (images.length > 0) {
      return images[slideshowIndex % images.length];
    }
  }
  const images = hero.backgroundImages ?? [];
  return hero.couplePhoto ?? theme.backgroundImage ?? images[0];
}

export function getHeroBackgroundStyle(
  theme: ThemeSettings,
  hero: HeroSettings,
  imageUrl?: string
): CSSProperties {
  if (hero.layout === "video-background" && hero.videoBackgroundUrl) {
    return {};
  }

  if (imageUrl) {
    const pos = hero.imagePosition ?? { x: 50, y: 50 };
    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: `${hero.imageZoom ?? 100}%`,
      backgroundPosition: `${pos.x}% ${pos.y}%`,
      backgroundRepeat: "no-repeat",
      filter: [
        theme.backgroundMode === "blur" ? `blur(${hero.blurAmount}px)` : null,
        hero.brightness !== 100 ? `brightness(${hero.brightness}%)` : null,
      ]
        .filter(Boolean)
        .join(" ") || undefined,
      transform: hero.imageRotation ? `rotate(${hero.imageRotation}deg) scale(1.15)` : undefined,
    };
  }

  return {
    background: `linear-gradient(160deg, ${theme.screenBackgrounds?.homepage ?? theme.colors.secondary} 0%, ${theme.colors.primary} 50%, ${theme.colors.secondary} 100%)`,
  };
}

export function getHeroOverlayStyle(hero: HeroSettings): CSSProperties {
  const opacity = hero.overlayOpacity ?? 0.45;
  if (hero.lightOverlay) {
    return {
      background: `rgba(255,255,255,${opacity * 0.6})`,
    };
  }
  if (hero.useGradientOverlay) {
    const grad = hero.overlayGradient ?? { from: "#000000", to: "#000000", angle: 180 };
    return {
      background: `linear-gradient(${grad.angle}deg, ${grad.from}, ${grad.to})`,
      opacity,
    };
  }
  return {
    background: hero.overlayColor ?? "#000000",
    opacity,
  };
}

export function getInvitationWrapperClass(style: HeroSettings["invitationStyle"]): string {
  switch (style) {
    case "floral-border":
      return "border-2 border-champagne/40 rounded-[2rem] p-8 md:p-12 relative before:content-['✿'] before:absolute before:top-4 before:left-4 before:text-champagne/50 after:content-['✿'] after:absolute after:bottom-4 after:right-4 after:text-champagne/50";
    case "gold-accents":
      return "border border-champagne/60 rounded-2xl p-8 md:p-10 shadow-[0_0_40px_rgba(201,169,98,0.15)]";
    case "glass-card":
      return "luxury-glass rounded-[2rem] p-8 md:p-12 border border-white/20 backdrop-blur-xl bg-white/10";
    case "luxury":
      return "rounded-[2rem] p-8 md:p-12 border border-champagne/20 bg-black/20 backdrop-blur-sm";
    case "minimal":
      return "p-4 md:p-6";
    default:
      return "";
  }
}

export function getTextShadowStyle(enabled: boolean): CSSProperties {
  return enabled ? { textShadow: "0 2px 16px rgba(0,0,0,0.45)" } : {};
}

export function getContentBackdropStyle(blur: number): CSSProperties {
  if (blur <= 0) return {};
  return {
    backdropFilter: `blur(${blur}px)`,
    background: "rgba(0,0,0,0.15)",
    borderRadius: "1.5rem",
    padding: "1.5rem",
  };
}

export function getCoupleLabel(event: WeddingEvent): string {
  return `${event.settings.groomName} & ${event.settings.brideName}`;
}
