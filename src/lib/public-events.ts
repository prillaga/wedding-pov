import { DEMO_EVENT_ID } from "@/lib/constants";
import { getHardcodedDemoEvent } from "@/lib/demo-event";
import type { WeddingEvent } from "@/types";

/** Built-in events always available on every device (no cloud required). */
export function getPublicEvents(): Record<string, WeddingEvent> {
  return {
    [DEMO_EVENT_ID]: getHardcodedDemoEvent(),
  };
}

export function getPublicEvent(eventId: string): WeddingEvent | null {
  return getPublicEvents()[eventId] ?? null;
}

/** Alternate codes guests may type — all map to the demo wedding. */
export const EVENT_ID_ALIASES: Record<string, string> = {
  prillaga: DEMO_EVENT_ID,
  "prillaga-wedding": DEMO_EVENT_ID,
  "prillaga-wedding-2026": DEMO_EVENT_ID,
  demo: DEMO_EVENT_ID,
  jj2027: DEMO_EVENT_ID,
  jb2027: DEMO_EVENT_ID,
};

export function resolveEventIdAlias(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const key = trimmed.toLowerCase();
  return EVENT_ID_ALIASES[key] ?? trimmed;
}
