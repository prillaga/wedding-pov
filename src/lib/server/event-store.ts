import { ADMIN_PASSWORD } from "@/lib/constants";
import { isDemoEventId, normalizeEventId } from "@/lib/demo-event";
import { getEventShortCode } from "@/lib/event-utils";
import { getPublicEvent, resolveEventIdAlias } from "@/lib/public-events";
import type { WeddingEvent } from "@/types";
import { head, put } from "@vercel/blob";

const KEY_PREFIX = "wedding-pov:event:";
const BLOB_PREFIX = "wedding-pov/events/";
const SHORT_CODE_PREFIX = "wedding-pov:shortcode:";
const SHORT_CODE_BLOB_PREFIX = "wedding-pov/shortcodes/";

function eventKey(eventId: string): string {
  return `${KEY_PREFIX}${normalizeEventId(eventId)}`;
}

function blobPath(eventId: string): string {
  return `${BLOB_PREFIX}${normalizeEventId(eventId)}.json`;
}

function hasKv(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function hasBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function kvGet(key: string): Promise<string | null> {
  if (!hasKv()) return null;
  const res = await fetch(`${process.env.KV_REST_API_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result?: string | null };
  return data.result ?? null;
}

/** Upstash REST — POST body supports large event JSON (photos included). */
async function kvSet(key: string, value: string): Promise<boolean> {
  if (!hasKv()) return false;
  const res = await fetch(process.env.KV_REST_API_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["SET", key, value]),
  });
  return res.ok;
}

async function readEventFromBlob(eventId: string): Promise<WeddingEvent | null> {
  if (!hasBlob()) return null;
  try {
    const meta = await head(blobPath(eventId), {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as WeddingEvent;
  } catch {
    return null;
  }
}

async function writeEventToBlob(event: WeddingEvent): Promise<boolean> {
  if (!hasBlob()) return false;
  try {
    await put(blobPath(event.id), JSON.stringify(event), {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return true;
  } catch {
    return false;
  }
}

async function readEventFromKv(eventId: string): Promise<WeddingEvent | null> {
  const raw = await kvGet(eventKey(eventId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WeddingEvent;
  } catch {
    return null;
  }
}

export function isCloudStorageConfigured(): boolean {
  return hasBlob() || hasKv();
}

export function getCloudStorageKind(): "blob" | "kv" | "none" {
  if (hasBlob()) return "blob";
  if (hasKv()) return "kv";
  return "none";
}

export function verifyAdminPassword(password: string | null): boolean {
  if (!password) return false;
  const expected = process.env.ADMIN_PASSWORD?.trim() || ADMIN_PASSWORD;
  return password === expected;
}

export async function readEventFromCloud(eventId: string): Promise<WeddingEvent | null> {
  const id = normalizeEventId(eventId);
  if (!id) return null;

  if (isDemoEventId(id)) {
    const fromBlob = await readEventFromBlob(id);
    if (fromBlob) return fromBlob;
    const fromKv = await readEventFromKv(id);
    if (fromKv) return fromKv;
    return getPublicEvent(id);
  }

  const published = getPublicEvent(id);
  if (published) return published;

  const fromBlob = await readEventFromBlob(id);
  if (fromBlob) return fromBlob;

  return readEventFromKv(id);
}

export async function writeEventToCloud(event: WeddingEvent): Promise<boolean> {
  const blobOk = await writeEventToBlob(event);
  const kvOk = blobOk ? true : await kvSet(eventKey(event.id), JSON.stringify(event));
  void writeShortCodeIndex(event);
  return blobOk || kvOk;
}

function shortCodeLookupKey(code: string): string {
  return `${SHORT_CODE_PREFIX}${code.trim().toUpperCase()}`;
}

async function writeShortCodeIndex(event: WeddingEvent): Promise<void> {
  const code = getEventShortCode(event.settings).toUpperCase();
  if (!code) return;

  if (hasKv()) {
    await kvSet(shortCodeLookupKey(code), event.id);
    return;
  }

  if (hasBlob()) {
    try {
      await put(`${SHORT_CODE_BLOB_PREFIX}${code}.txt`, event.id, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "text/plain",
      });
    } catch {
      // Non-fatal — direct id lookup still works
    }
  }
}

async function resolveEventIdFromShortCode(code: string): Promise<string | null> {
  const upper = code.trim().toUpperCase();
  if (!/^[A-Z]{2}\d{4}$/.test(upper)) return null;

  if (hasKv()) {
    const mapped = await kvGet(shortCodeLookupKey(upper));
    if (mapped) return normalizeEventId(mapped);
  }

  if (hasBlob()) {
    try {
      const meta = await head(`${SHORT_CODE_BLOB_PREFIX}${upper}.txt`, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      const res = await fetch(meta.url, { cache: "no-store" });
      if (res.ok) {
        const mapped = (await res.text()).trim();
        if (mapped) return normalizeEventId(mapped);
      }
    } catch {
      // fall through
    }
  }

  return null;
}

/** Resolve event id, alias, or guest short code (e.g. JJ2027). */
export async function lookupEventByCode(code: string): Promise<WeddingEvent | null> {
  const trimmed = code.trim();
  if (!trimmed) return null;

  const directId = normalizeEventId(trimmed);
  const aliased = resolveEventIdAlias(trimmed);

  for (const candidate of [directId, aliased]) {
    if (!candidate) continue;
    const event = await readEventFromCloud(candidate);
    if (event) return event;
  }

  const fromShortCode = await resolveEventIdFromShortCode(trimmed);
  if (fromShortCode) {
    const event = await readEventFromCloud(fromShortCode);
    if (event) return event;
  }

  if (isDemoEventId(aliased)) {
    return getPublicEvent(aliased);
  }

  return null;
}
