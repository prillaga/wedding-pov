import type { EventSettings, EventStatus, WeddingEvent } from "@/types";

export function slugifyName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function parseEventCodeInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  try {
    const url = trimmed.startsWith("http") ? new URL(trimmed) : new URL(trimmed, "https://weddingpov.local");
    const parts = url.pathname.split("/").filter(Boolean);
    for (const key of ["wedding", "join", "event", "dashboard"]) {
      const idx = parts.indexOf(key);
      if (idx >= 0 && parts[idx + 1]) return decodeURIComponent(parts[idx + 1]);
    }
  } catch {
    // Not a URL — treat as raw event id
  }

  return trimmed.replace(/^#/, "").split(/[?#]/)[0].trim();
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

export function getEventJoinUrl(eventId: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/wedding/${eventId}`;
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
