import { DEFAULT_HERO, DEFAULT_MODERATION, DEFAULT_PHOTO_LIMITS, DEFAULT_PHOTO_MANAGEMENT, DEFAULT_SCREEN_BACKGROUNDS, DEFAULT_SLIDESHOW, DEFAULT_THEME, DEFAULT_VIDEO_LIMITS, THEME_PRESETS } from "@/lib/constants";
import { normalizeEventId } from "@/lib/demo-event";
import type { WeddingEvent } from "@/types";

const SESSION_PREFIX = "wedding-pov:event-cache:";

/** Compact event payload embedded in QR URLs / portable codes. */
interface CompactBootstrap {
  i: string;
  cn: string;
  wd: string;
  v: string;
  st?: WeddingEvent["status"];
  bn: string;
  gn: string;
  hd: string;
  ht: string;
  wm?: string;
  mp?: WeddingEvent["photoLimits"]["maxPhotos"];
  tp?: WeddingEvent["theme"]["preset"];
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

function compactFromEvent(event: WeddingEvent): CompactBootstrap {
  const { settings } = event;
  return {
    i: event.id,
    cn: event.coupleName,
    wd: event.weddingDate,
    v: event.venue,
    st: event.status,
    bn: settings.brideName,
    gn: settings.groomName,
    hd: settings.weddingDate,
    ht: settings.hashtag,
    wm: settings.welcomeMessage,
    mp: event.photoLimits.maxPhotos,
    tp: event.theme.preset,
  };
}

function eventFromCompact(raw: CompactBootstrap): WeddingEvent | null {
  const id = normalizeEventId(raw.i);
  if (!id || !raw.bn || !raw.gn) return null;

  const preset = raw.tp ?? "champagne";
  const presetKey = preset in THEME_PRESETS ? preset : "champagne";
  const colors = THEME_PRESETS[presetKey as keyof typeof THEME_PRESETS].colors;

  const settings = {
    brideName: raw.bn,
    groomName: raw.gn,
    weddingDate: raw.hd || raw.wd,
    venue: raw.v,
    hashtag: raw.ht,
    welcomeMessage: raw.wm ?? "",
  };

  return {
    id,
    coupleName: raw.cn || `${settings.groomName} & ${settings.brideName}`,
    weddingDate: raw.wd,
    venue: raw.v,
    createdAt: new Date().toISOString(),
    status: raw.st ?? "active",
    settings,
    photoLimits: {
      ...DEFAULT_PHOTO_LIMITS,
      maxPhotos: raw.mp ?? DEFAULT_PHOTO_LIMITS.maxPhotos,
    },
    videoLimits: { ...DEFAULT_VIDEO_LIMITS },
    theme: {
      ...DEFAULT_THEME,
      preset,
      colors,
      screenBackgrounds: { ...DEFAULT_SCREEN_BACKGROUNDS },
      hero: { ...DEFAULT_HERO },
    },
    slideshow: {
      ...DEFAULT_SLIDESHOW,
      intro: {
        title: settings.groomName + " & " + settings.brideName,
        subtitle: "Wedding Memories",
        line3: "Captured By Family & Friends",
        date: raw.wd,
      },
      outro: {
        title: "Thank You",
        subtitle: "For Celebrating With Us",
        line3: settings.groomName + " & " + settings.brideName,
      },
    },
    moderation: { ...DEFAULT_MODERATION },
    photoManagement: { ...DEFAULT_PHOTO_MANAGEMENT },
  };
}

export function encodeEventBootstrap(event: WeddingEvent): string {
  return toBase64Url(JSON.stringify(compactFromEvent(event)));
}

export function decodeEventBootstrap(encoded: string): WeddingEvent | null {
  try {
    const raw = JSON.parse(fromBase64Url(encoded)) as CompactBootstrap;
    return eventFromCompact(raw);
  } catch {
    return null;
  }
}

export function getPortableEventCode(event: WeddingEvent): string {
  return `wedding-pov:${encodeEventBootstrap(event)}`;
}

export function parsePortableEventCode(raw: string): WeddingEvent | null {
  const match = raw.trim().match(/^wedding-pov:([A-Za-z0-9_-]+)$/i);
  if (!match?.[1]) return null;
  return decodeEventBootstrap(match[1]);
}

export function cacheEventInSession(event: WeddingEvent): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${SESSION_PREFIX}${event.id}`, JSON.stringify(event));
  } catch {
    // ignore quota errors
  }
}

export function readEventFromSession(eventId: string): WeddingEvent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${SESSION_PREFIX}${normalizeEventId(eventId)}`);
    if (!raw) return null;
    return JSON.parse(raw) as WeddingEvent;
  } catch {
    return null;
  }
}

function readBootstrapParam(search: string): string | null {
  const params = new URLSearchParams(search);
  return params.get("c") ?? params.get("cfg");
}

export function readBootstrapFromLocation(): WeddingEvent | null {
  if (typeof window === "undefined") return null;
  const token = readBootstrapParam(window.location.search);
  if (!token) return null;
  return decodeEventBootstrap(token);
}

export function extractCfgParam(raw: string): string | null {
  try {
    const parsed = raw.trim().startsWith("http")
      ? new URL(raw.trim())
      : new URL(raw.trim(), "https://weddingpov.local");
    return readBootstrapParam(parsed.search);
  } catch {
    return null;
  }
}

export function readBootstrapFromUrl(url: string): WeddingEvent | null {
  const token = extractCfgParam(url);
  if (!token) return null;
  return decodeEventBootstrap(token);
}

export function buildJoinPath(eventId: string, bootstrap?: string): string {
  const base = `/wedding/${encodeURIComponent(eventId)}`;
  if (!bootstrap) return base;
  return `${base}?c=${bootstrap}`;
}
