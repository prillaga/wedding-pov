import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { verifyAdminPassword } from "@/lib/server/event-store";
import { listPhotosFromCloud } from "@/lib/server/photo-store";
import { readEventFromCloud } from "@/lib/server/event-store";
import { normalizeEventId } from "@/lib/demo-event";
import type {
  PrintCenterPhoto,
  PrintCenterPhotosQuery,
  PrintCenterPhotosResponse,
  PrintCenterStats,
  PrintHistoryFilter,
  PrintHistoryItem,
  PrintQueueItem,
  PrintQueueStatus,
  FavoriteRecord,
  AiHighlightType,
} from "@/types/print-center";
import type { Upload, WeddingEvent } from "@/types";
import { put, head } from "@vercel/blob";

const ADMIN_USER_ID = "admin";
const BLOB_PRINT_PREFIX = "wedding-pov/print-center/";

function hasBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readBlobJson<T>(path: string, fallback: T): Promise<T> {
  if (!hasBlob()) return fallback;
  try {
    const meta = await head(path, { token: process.env.BLOB_READ_WRITE_TOKEN });
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

async function writeBlobJson<T>(path: string, data: T): Promise<boolean> {
  if (!hasBlob()) return false;
  try {
    await put(path, JSON.stringify(data), {
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

function uploadToPrintPhoto(
  upload: Upload,
  event: WeddingEvent | null,
  extras?: Partial<PrintCenterPhoto>
): PrintCenterPhoto {
  const settings = event?.settings;
  const eventCategory =
    (settings as { eventType?: string } | undefined)?.eventType ??
    (event as { eventCategory?: string } | null)?.eventCategory ??
    "wedding";

  return {
    id: upload.id,
    eventId: upload.eventId,
    eventName: event?.coupleName ?? event?.settings?.brideName
      ? `${event.settings.brideName} & ${event.settings.groomName}`
      : upload.eventId,
    eventCategory,
    guestId: upload.guestId,
    guestName: upload.guestName,
    imageUrl: upload.imageData.startsWith("http") ? upload.imageData : upload.imageData,
    caption: upload.caption,
    segment: upload.segment,
    status: upload.status,
    isVideo: upload.isVideo,
    createdAt: upload.createdAt,
    ...extras,
  };
}

function getStoragePublicUrl(path: string, supabaseUrl: string): string {
  return `${supabaseUrl}/storage/v1/object/public/wedding-uploads/${path}`;
}

function weddingEventJoin(
  weddingEvents:
    | {
        couple_name: string;
        event_category: string;
        settings: WeddingEvent["settings"];
      }
    | {
        couple_name: string;
        event_category: string;
        settings: WeddingEvent["settings"];
      }[]
    | null
    | undefined
): { couple_name: string; event_category: string; settings: WeddingEvent["settings"] } {
  if (!weddingEvents) {
    return { couple_name: "", event_category: "wedding", settings: {} as WeddingEvent["settings"] };
  }
  return Array.isArray(weddingEvents) ? weddingEvents[0] : weddingEvents;
}

export async function fetchPhotosFromSupabase(
  query: PrintCenterPhotosQuery
): Promise<PrintCenterPhotosResponse | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const limit = Math.min(query.limit ?? 24, 48);
  let dbQuery = supabase
    .from("wedding_uploads")
    .select(
      `
      id, event_id, guest_id, guest_name, storage_path, caption, segment,
      filter, is_video, status, created_at, ai_score, ai_highlight_type,
      wedding_events!inner ( id, couple_name, event_category, settings )
    `
    )
    .neq("status", "removed")
    .eq("is_video", false)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (query.cursor) {
    dbQuery = dbQuery.lt("created_at", query.cursor);
  }

  if (query.eventCategory && query.eventCategory !== "all") {
    dbQuery = dbQuery.eq("wedding_events.event_category", query.eventCategory);
  }

  if (query.eventIds?.length) {
    dbQuery = dbQuery.in("event_id", query.eventIds);
  }

  const { data, error } = await dbQuery;
  if (error || !data) return null;

  const config = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const favoriteIds = query.favoritesOnly
    ? await getFavoritePhotoIdsSupabase()
    : await getFavoritePhotoIdsSupabase();

  const rows = data as unknown as Array<{
    id: string;
    event_id: string;
    guest_id: string;
    guest_name: string;
    storage_path: string;
    caption: string | null;
    segment: Upload["segment"];
    is_video: boolean;
    status: Upload["status"];
    created_at: string;
    ai_score: number | null;
    ai_highlight_type: AiHighlightType | null;
    wedding_events:
      | {
          couple_name: string;
          event_category: string;
          settings: WeddingEvent["settings"];
        }
      | {
          couple_name: string;
          event_category: string;
          settings: WeddingEvent["settings"];
        }[];
  }>;

  let filtered = rows;
  if (query.favoritesOnly) {
    filtered = rows.filter((r) => favoriteIds.has(r.id));
  }

  const hasMore = filtered.length > limit;
  const page = hasMore ? filtered.slice(0, limit) : filtered;

  const photos: PrintCenterPhoto[] = page.map((row) => {
    const event = weddingEventJoin(row.wedding_events);
    return {
      id: row.id,
      eventId: row.event_id,
      eventName: event.couple_name,
      eventCategory: event.event_category,
    guestId: row.guest_id,
    guestName: row.guest_name,
    imageUrl: getStoragePublicUrl(row.storage_path, config),
    caption: row.caption ?? undefined,
    segment: row.segment,
    status: row.status,
    isVideo: row.is_video,
    createdAt: row.created_at,
    aiScore: row.ai_score,
    aiHighlightType: row.ai_highlight_type,
    isFavorite: favoriteIds.has(row.id),
    };
  });

  return {
    photos,
    nextCursor: hasMore ? page[page.length - 1]?.created_at ?? null : null,
    hasMore,
  };
}

async function getFavoritePhotoIdsSupabase(): Promise<Set<string>> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return new Set();
  const { data } = await supabase
    .from("favorites")
    .select("photo_id")
    .eq("user_id", ADMIN_USER_ID);
  return new Set((data ?? []).map((r: { photo_id: string }) => r.photo_id));
}

export async function fetchPhotosFromBlobEvents(
  query: PrintCenterPhotosQuery
): Promise<PrintCenterPhotosResponse> {
  const eventIds = query.eventIds ?? [];
  const limit = query.limit ?? 24;
  const allPhotos: PrintCenterPhoto[] = [];

  for (const rawId of eventIds) {
    const eventId = normalizeEventId(rawId);
    if (!eventId) continue;
    const [photos, event] = await Promise.all([
      listPhotosFromCloud(eventId),
      readEventFromCloud(eventId),
    ]);

    for (const upload of photos) {
      if (upload.isVideo || upload.status === "removed") continue;
      const photo = uploadToPrintPhoto(upload, event);
      if (
        query.eventCategory &&
        query.eventCategory !== "all" &&
        photo.eventCategory !== query.eventCategory
      ) {
        continue;
      }
      allPhotos.push(photo);
    }
  }

  allPhotos.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  let startIdx = 0;
  if (query.cursor) {
    startIdx = allPhotos.findIndex((p) => p.createdAt === query.cursor) + 1;
    if (startIdx < 0) startIdx = 0;
  }

  const favoriteIds = await getFavoritePhotoIdsBlob();
  for (const p of allPhotos) {
    p.isFavorite = favoriteIds.has(p.id);
  }

  let slice = allPhotos.slice(startIdx, startIdx + limit + 1);
  if (query.favoritesOnly) {
    slice = allPhotos.filter((p) => p.isFavorite).slice(startIdx, startIdx + limit + 1);
  }

  const hasMore = slice.length > limit;
  const page = hasMore ? slice.slice(0, limit) : slice;

  return {
    photos: page,
    nextCursor: hasMore ? page[page.length - 1]?.createdAt ?? null : null,
    hasMore,
  };
}

export async function fetchPrintCenterPhotos(
  query: PrintCenterPhotosQuery
): Promise<PrintCenterPhotosResponse> {
  if (isSupabaseConfigured()) {
    const fromDb = await fetchPhotosFromSupabase(query);
    if (fromDb) return fromDb;
  }
  return fetchPhotosFromBlobEvents(query);
}

// ── Print Queue ─────────────────────────────────────────────────────────────

type BlobQueueStore = { items: PrintQueueItem[] };

async function readQueueBlob(): Promise<BlobQueueStore> {
  return readBlobJson(`${BLOB_PRINT_PREFIX}queue.json`, { items: [] });
}

async function writeQueueBlob(store: BlobQueueStore): Promise<boolean> {
  return writeBlobJson(`${BLOB_PRINT_PREFIX}queue.json`, store);
}

export async function addToPrintQueue(
  photoId: string,
  eventId: string,
  printedBy = ADMIN_USER_ID
): Promise<PrintQueueItem | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("print_queue")
      .insert({
        photo_id: photoId,
        event_id: eventId,
        status: "pending",
        printed_by: printedBy,
      })
      .select()
      .single();
    if (error || !data) return null;
    return mapQueueRow(data);
  }

  const store = await readQueueBlob();
  const item: PrintQueueItem = {
    id: crypto.randomUUID(),
    photoId,
    eventId,
    status: "pending",
    printedBy,
    createdAt: new Date().toISOString(),
  };
  store.items.unshift(item);
  await writeQueueBlob(store);
  return item;
}

export async function markQueuePrinted(
  queueId: string,
  printedBy = ADMIN_USER_ID
): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { error } = await supabase
      .from("print_queue")
      .update({ status: "printed", printed_at: now, printed_by: printedBy })
      .eq("id", queueId);
    return !error;
  }

  const store = await readQueueBlob();
  const item = store.items.find((i) => i.id === queueId);
  if (!item) return false;
  item.status = "printed";
  item.printedAt = now;
  item.printedBy = printedBy;
  await writeQueueBlob(store);
  return true;
}

export async function getPrintHistory(
  filter: PrintHistoryFilter = "all"
): Promise<PrintHistoryItem[]> {
  const supabase = getSupabaseServerClient();
  const now = new Date();

  if (supabase) {
    let q = supabase
      .from("print_queue")
      .select("*")
      .eq("status", "printed")
      .order("printed_at", { ascending: false })
      .limit(100);

    if (filter === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      q = q.gte("printed_at", start.toISOString());
    } else if (filter === "week") {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      q = q.gte("printed_at", start.toISOString());
    }

    const { data } = await q;
    if (!data) return [];

    const items = await Promise.all(
      (data as Record<string, unknown>[]).map(async (row) => {
        const mapped = mapQueueRow(row);
        const photoRes = await fetchPrintCenterPhotos({
          limit: 1,
          eventIds: [mapped.eventId],
        });
        const photo = photoRes.photos.find((p) => p.id === mapped.photoId);
        return photo ? { ...mapped, photo } : null;
      })
    );
    return items.filter((i): i is PrintHistoryItem => i !== null);
  }

  const store = await readQueueBlob();
  let items = store.items.filter((i) => i.status === "printed");
  if (filter === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    items = items.filter(
      (i) => i.printedAt && new Date(i.printedAt) >= start
    );
  } else if (filter === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    items = items.filter(
      (i) => i.printedAt && new Date(i.printedAt) >= start
    );
  }
  return items.map((i) => ({
    ...i,
    photo: i.photo ?? ({
      id: i.photoId,
      eventId: i.eventId,
      eventName: i.eventId,
      eventCategory: "wedding",
      guestId: "",
      guestName: "Guest",
      imageUrl: "",
      segment: "other",
      status: "approved",
      isVideo: false,
      createdAt: i.createdAt,
    } as PrintCenterPhoto),
  }));
}

export async function getPendingQueue(): Promise<PrintQueueItem[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase
      .from("print_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    return (data ?? []).map(mapQueueRow);
  }
  const store = await readQueueBlob();
  return store.items.filter((i) => i.status === "pending");
}

function mapQueueRow(row: Record<string, unknown>): PrintQueueItem {
  return {
    id: String(row.id),
    photoId: String(row.photo_id),
    eventId: String(row.event_id),
    status: row.status as PrintQueueStatus,
    printedBy: row.printed_by ? String(row.printed_by) : null,
    printedAt: row.printed_at ? String(row.printed_at) : null,
    createdAt: String(row.created_at),
  };
}

// ── Favorites ───────────────────────────────────────────────────────────────

type BlobFavoritesStore = { items: FavoriteRecord[] };

async function readFavoritesBlob(): Promise<BlobFavoritesStore> {
  return readBlobJson(`${BLOB_PRINT_PREFIX}favorites.json`, { items: [] });
}

async function writeFavoritesBlob(store: BlobFavoritesStore): Promise<boolean> {
  return writeBlobJson(`${BLOB_PRINT_PREFIX}favorites.json`, store);
}

async function getFavoritePhotoIdsBlob(): Promise<Set<string>> {
  const store = await readFavoritesBlob();
  return new Set(store.items.map((i) => i.photoId));
}

export async function toggleFavorite(photoId: string): Promise<{ favorited: boolean }> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("photo_id", photoId)
      .eq("user_id", ADMIN_USER_ID)
      .maybeSingle();

    if (existing) {
      await supabase.from("favorites").delete().eq("id", existing.id);
      return { favorited: false };
    }

    await supabase.from("favorites").insert({
      photo_id: photoId,
      user_id: ADMIN_USER_ID,
    });
    return { favorited: true };
  }

  const store = await readFavoritesBlob();
  const idx = store.items.findIndex((i) => i.photoId === photoId);
  if (idx >= 0) {
    store.items.splice(idx, 1);
    await writeFavoritesBlob(store);
    return { favorited: false };
  }

  store.items.push({
    id: crypto.randomUUID(),
    photoId,
    userId: ADMIN_USER_ID,
    createdAt: new Date().toISOString(),
  });
  await writeFavoritesBlob(store);
  return { favorited: true };
}

export async function getPrintCenterStats(
  eventIds: string[]
): Promise<PrintCenterStats> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const photosRes = await fetchPrintCenterPhotos({
    eventIds,
    limit: 500,
  });

  const photosUploadedToday = photosRes.photos.filter(
    (p) => new Date(p.createdAt) >= todayStart
  ).length;

  const [pending, history, favBlob, favDb] = await Promise.all([
    getPendingQueue(),
    getPrintHistory("today"),
    readFavoritesBlob(),
    isSupabaseConfigured() ? getFavoritePhotoIdsSupabase() : Promise.resolve(new Set<string>()),
  ]);

  const favoriteCount = isSupabaseConfigured()
    ? favDb.size
    : favBlob.items.length;

  return {
    photosUploadedToday,
    photosPrintedToday: history.length,
    favoriteCount,
    pendingQueueCount: pending.length,
  };
}

export async function deletePhotoAdmin(
  photoId: string,
  eventId: string
): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase
      .from("wedding_uploads")
      .update({ status: "removed" })
      .eq("id", photoId);
    return !error;
  }

  const { updatePhotoInCloud } = await import("@/lib/server/photo-store");
  return updatePhotoInCloud(eventId, photoId, { status: "removed" });
}

export function requireAdmin(request: Request): boolean {
  return verifyAdminPassword(request.headers.get("x-admin-password"));
}

export { ADMIN_USER_ID };
