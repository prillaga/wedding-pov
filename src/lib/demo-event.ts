import type { WeddingEvent } from "@/types";
import {
  DEFAULT_EVENT_SETTINGS,
  DEFAULT_HERO,
  DEFAULT_HERO_TEXT_COLORS,
  DEFAULT_MODERATION,
  DEFAULT_PHOTO_LIMITS,
  DEFAULT_PHOTO_MANAGEMENT,
  DEFAULT_VIDEO_LIMITS,
  DEFAULT_SCREEN_BACKGROUNDS,
  DEFAULT_SLIDESHOW,
  DEFAULT_THEME,
  DEMO_EVENT_ID,
  THEME_PRESETS,
} from "./constants";

/** Fixed timestamp so SSR and client hydration always match. */
const DEMO_CREATED_AT = "2025-01-01T00:00:00.000Z";

export function normalizeEventId(raw: string | undefined): string {
  if (!raw) return "";
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

const DEMO_EVENT_ALIASES = new Set([
  DEMO_EVENT_ID,
  "prillaga",
  "prillaga-wedding",
  "demo",
  "jj2027",
  "jb2027",
]);

export function isDemoEventId(eventId: string): boolean {
  return DEMO_EVENT_ALIASES.has(normalizeEventId(eventId).toLowerCase());
}

/** Map guest-facing codes (e.g. JJ2027) to the stored event id. */
export function toCanonicalEventId(eventId: string): string {
  if (isDemoEventId(eventId)) return DEMO_EVENT_ID;
  return normalizeEventId(eventId);
}

/** Built-in demo wedding — no localStorage required. */
export function getHardcodedDemoEvent(): WeddingEvent {
  return {
    id: DEMO_EVENT_ID,
    coupleName: "John & Jane",
    weddingDate: "2027-06-20",
    venue: "The Garden Pavilion",
    createdAt: DEMO_CREATED_AT,
    status: "active",
    pin: "2027",
    settings: {
      ...DEFAULT_EVENT_SETTINGS,
      brideName: "Jane",
      groomName: "John",
    },
    photoLimits: { ...DEFAULT_PHOTO_LIMITS },
    videoLimits: { ...DEFAULT_VIDEO_LIMITS },
    theme: {
      ...DEFAULT_THEME,
      preset: "champagne",
      colors: THEME_PRESETS.champagne.colors,
      screenBackgrounds: { ...DEFAULT_SCREEN_BACKGROUNDS },
      hero: { ...DEFAULT_HERO, textColors: { ...DEFAULT_HERO_TEXT_COLORS } },
    },
    slideshow: {
      ...DEFAULT_SLIDESHOW,
      intro: {
        title: "John & Jane",
        subtitle: "Wedding Memories",
        line3: "Captured By Family & Friends",
        date: "June 20, 2027",
      },
      outro: { title: "Thank You", subtitle: "For Celebrating With Us", line3: "John & Jane" },
    },
    moderation: { ...DEFAULT_MODERATION },
    photoManagement: { ...DEFAULT_PHOTO_MANAGEMENT },
  };
}
