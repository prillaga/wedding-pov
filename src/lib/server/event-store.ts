import { ADMIN_PASSWORD } from "@/lib/constants";
import { isDemoEventId, normalizeEventId } from "@/lib/demo-event";
import { getPublicEvent } from "@/lib/public-events";
import type { WeddingEvent } from "@/types";

const KEY_PREFIX = "wedding-pov:event:";

function eventKey(eventId: string): string {
  return `${KEY_PREFIX}${normalizeEventId(eventId)}`;
}

function hasKv(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
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

async function kvSet(key: string, value: string): Promise<boolean> {
  if (!hasKv()) return false;
  const res = await fetch(`${process.env.KV_REST_API_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
  return res.ok;
}

export function isCloudStorageConfigured(): boolean {
  return hasKv();
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
    return getPublicEvent(id);
  }

  const published = getPublicEvent(id);
  if (published) return published;

  const raw = await kvGet(eventKey(id));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as WeddingEvent;
  } catch {
    return null;
  }
}

export async function writeEventToCloud(event: WeddingEvent): Promise<boolean> {
  if (!hasKv()) return false;
  const payload = JSON.stringify(event);
  return kvSet(eventKey(event.id), payload);
}
