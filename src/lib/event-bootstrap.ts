import { DEFAULT_HERO, DEFAULT_MODERATION, DEFAULT_PHOTO_LIMITS, DEFAULT_PHOTO_MANAGEMENT, DEFAULT_SCREEN_BACKGROUNDS, DEFAULT_SLIDESHOW, DEFAULT_THEME, THEME_PRESETS } from "@/lib/constants";
import { normalizeEventId } from "@/lib/demo-event";
import type { WeddingEvent } from "@/types";

/** Compact event payload embedded in QR URLs for cross-device guest access. */
export interface EventBootstrap {
  id: string;
  coupleName: string;
  weddingDate: string;
  venue: string;
  status: WeddingEvent["status"];
  settings: WeddingEvent["settings"];
  photoLimits: WeddingEvent["photoLimits"];
  themePreset?: WeddingEvent["theme"]["preset"];
  slideshowStyle?: WeddingEvent["slideshow"]["style"];
  moderation?: Pick<WeddingEvent["moderation"], "uploadsDisabled">;
  photoManagement?: WeddingEvent["photoManagement"];
}

function toBase64Url(value: string): string {
  const base64 =
    typeof window !== "undefined"
      ? btoa(unescape(encodeURIComponent(value)))
      : Buffer.from(value, "utf-8").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return typeof window !== "undefined"
    ? decodeURIComponent(escape(atob(padded)))
    : Buffer.from(padded, "base64").toString("utf-8");
}

export function encodeEventBootstrap(event: WeddingEvent): string {
  const payload: EventBootstrap = {
    id: event.id,
    coupleName: event.coupleName,
    weddingDate: event.weddingDate,
    venue: event.venue,
    status: event.status,
    settings: event.settings,
    photoLimits: event.photoLimits,
    themePreset: event.theme.preset,
    slideshowStyle: event.slideshow.style,
    moderation: { uploadsDisabled: event.moderation.uploadsDisabled },
    photoManagement: event.photoManagement,
  };
  return toBase64Url(JSON.stringify(payload));
}

export function decodeEventBootstrap(encoded: string): WeddingEvent | null {
  try {
    const raw = JSON.parse(fromBase64Url(encoded)) as EventBootstrap;
    const id = normalizeEventId(raw.id);
    if (!id || !raw.settings?.brideName || !raw.settings?.groomName) return null;

    const preset = raw.themePreset ?? "champagne";
    const presetKey = preset in THEME_PRESETS ? preset : "champagne";
    const colors = THEME_PRESETS[presetKey as keyof typeof THEME_PRESETS].colors;

    return {
      id,
      coupleName: raw.coupleName,
      weddingDate: raw.weddingDate,
      venue: raw.venue,
      createdAt: new Date().toISOString(),
      status: raw.status ?? "active",
      settings: raw.settings,
      photoLimits: raw.photoLimits ?? { ...DEFAULT_PHOTO_LIMITS },
      theme: {
        ...DEFAULT_THEME,
        preset,
        colors,
        screenBackgrounds: { ...DEFAULT_SCREEN_BACKGROUNDS },
        hero: { ...DEFAULT_HERO },
      },
      slideshow: {
        ...DEFAULT_SLIDESHOW,
        style: raw.slideshowStyle ?? DEFAULT_SLIDESHOW.style,
        intro: {
          title: raw.coupleName,
          subtitle: "Wedding Memories",
          line3: "Captured By Family & Friends",
          date: raw.weddingDate,
        },
        outro: {
          title: "Thank You",
          subtitle: "For Celebrating With Us",
          line3: raw.coupleName,
        },
      },
      moderation: { ...DEFAULT_MODERATION, ...(raw.moderation ?? {}) },
      photoManagement: { ...DEFAULT_PHOTO_MANAGEMENT, ...(raw.photoManagement ?? {}) },
    };
  } catch {
    return null;
  }
}

export function readBootstrapFromLocation(): WeddingEvent | null {
  if (typeof window === "undefined") return null;
  const cfg = new URLSearchParams(window.location.search).get("cfg");
  if (!cfg) return null;
  return decodeEventBootstrap(cfg);
}

export function extractCfgParam(raw: string): string | null {
  try {
    const parsed = raw.trim().startsWith("http")
      ? new URL(raw.trim())
      : new URL(raw.trim(), "https://weddingpov.local");
    return parsed.searchParams.get("cfg");
  } catch {
    return null;
  }
}

export function readBootstrapFromUrl(url: string): WeddingEvent | null {
  const cfg = extractCfgParam(url);
  if (!cfg) return null;
  return decodeEventBootstrap(cfg);
}
