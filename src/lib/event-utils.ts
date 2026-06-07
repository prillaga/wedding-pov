import type { EventSettings, EventStatus, WeddingEvent } from "@/types";
import { getHardcodedDemoEvent, isDemoEventId } from "@/lib/demo-event";
import {
  decodeEventBootstrap,
  parsePortableEventCode,
  readBootstrapFromUrl,
} from "@/lib/event-bootstrap";
import { resolveEventIdAlias } from "@/lib/public-events";

export { getEventJoinUrl } from "./app-url";

export interface ResolvedEventInput {
  eventId: string;
  embeddedEvent?: WeddingEvent;
}

export function slugifyName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function parseEventCodeInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const portable = parsePortableEventCode(trimmed);
  if (portable) return portable.id;

  const compactMatch = trimmed.match(/^wedding-pov:([A-Za-z0-9_-]+)$/i);
  if (compactMatch?.[1]) {
    const decoded = decodeEventBootstrap(compactMatch[1]);
    if (decoded) return decoded.id;
    return decodeURIComponent(compactMatch[1].trim());
  }

  try {
    const url = trimmed.startsWith("http") ? new URL(trimmed) : new URL(trimmed, "https://weddingpov.local");
    const parts = url.pathname.split("/").filter(Boolean);
    for (const key of ["wedding", "join", "event"]) {
      const idx = parts.indexOf(key);
      if (idx >= 0 && parts[idx + 1]) return decodeURIComponent(parts[idx + 1]);
    }
    if (parts.length === 1 && !parts[0].includes(".")) {
      return decodeURIComponent(parts[0]);
    }
  } catch {
    // Not a URL — treat as raw event id
  }

  return trimmed.replace(/^#/, "").split(/[?#]/)[0].trim();
}

/** Parse QR scans, links, portable codes, and manual entry into an event id. */
export function resolveEventInput(raw: string): ResolvedEventInput {
  const trimmed = raw.trim();
  if (!trimmed) return { eventId: "" };

  const portable = parsePortableEventCode(trimmed);
  if (portable) {
    return { eventId: portable.id, embeddedEvent: portable };
  }

  const fromUrl = readBootstrapFromUrl(trimmed);
  if (fromUrl) {
    return { eventId: fromUrl.id, embeddedEvent: fromUrl };
  }

  const parsed = parseEventCodeInput(trimmed);
  if (!parsed) return { eventId: "" };

  const aliased = resolveEventIdAlias(parsed);
  if (isDemoEventId(aliased)) {
    return { eventId: aliased, embeddedEvent: getHardcodedDemoEvent() };
  }

  return { eventId: aliased };
}

export function resolveEventIdFromInput(raw: string): string {
  return resolveEventInput(raw).eventId;
}

/** Match admin short codes (e.g. JJ2027) against locally stored events. */
export function findLocalEventIdByShortCode(code: string, events: WeddingEvent[]): string | null {
  const upper = code.trim().toUpperCase();
  if (!/^[A-Z]{2}\d{4}$/.test(upper)) return null;
  for (const event of events) {
    if (getEventShortCode(event.settings).toUpperCase() === upper) {
      return event.id;
    }
  }
  return null;
}

export function generateEventSlug(
  settings: Pick<EventSettings, "brideName" | "groomName" | "weddingDate">,
  takenIds: string[]
): string {
  const groom = slugifyName(settings.groomName);
  const bride = slugifyName(settings.brideName);
  const year = settings.weddingDate.slice(0, 4);
  const base = `${groom}${bride}${year}` || `wedding-${Date.now()}`;
  let slug = base;
  let i = 2;
  while (takenIds.includes(slug)) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export function getEventShortCode(settings: Pick<EventSettings, "groomName" | "brideName" | "weddingDate">): string {
  const g = settings.groomName.trim()[0]?.toUpperCase() ?? "G";
  const b = settings.brideName.trim()[0]?.toUpperCase() ?? "B";
  const year = settings.weddingDate.slice(0, 4);
  return `${g}${b}${year}`;
}

export function generateDefaultHashtag(
  settings: Pick<EventSettings, "groomName" | "brideName" | "weddingDate">
): string {
  const groom = settings.groomName.replace(/\s+/g, "");
  const bride = settings.brideName.replace(/\s+/g, "");
  const year = settings.weddingDate.slice(0, 4);
  return `#${groom}And${bride}${year}`;
}

export function getEventStatusLabel(status: EventStatus | undefined): string {
  switch (status) {
    case "archived":
      return "Archived";
    case "paused":
      return "Paused";
    default:
      return "Active";
  }
}

export function isEventJoinable(event: WeddingEvent): boolean {
  return event.status !== "archived" && event.status !== "paused";
}

export function isEventUploadsAllowed(event: WeddingEvent): boolean {
  return isEventJoinable(event) && !event.moderation.uploadsDisabled;
}
