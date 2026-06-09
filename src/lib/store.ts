"use client";

import { v4 as uuidv4 } from "uuid";
import type {
  AdminTemplate,
  EventSegment,
  EventSettings,
  EventStats,
  Guest,
  HeroSettings,
  ModerationSettings,
  PhotoLimitSettings,
  PhotoLimitValue,
  PhotoManagementSettings,
  VideoLimitSettings,
  SlideshowConfig,
  SlideshowMusicSettings,
  ThemePreset,
  ThemeSettings,
  ThemeSettingsPatch,
  StorageDashboardStats,
  Upload,
  WeddingEvent,
} from "@/types";
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
  STORAGE_PLAN_GB,
  THEME_PRESETS,
} from "./constants";
import {
  getHardcodedDemoEvent,
  isDemoEventId,
  normalizeEventId,
  toCanonicalEventId,
} from "./demo-event";
import {
  DEMO_SAMPLE_GALLERY_CLEARED_KEY,
  DEMO_SAMPLE_GALLERY_VERSION,
  DEMO_SAMPLE_GALLERY_VERSION_KEY,
  DEMO_SAMPLE_GUEST_NAMES,
  DEMO_SAMPLE_PHOTOS,
  demoSampleCreatedAt,
} from "./demo-sample-photos";
import { readBootstrapFromLocation, readEventFromSession } from "./event-bootstrap";
import { fetchRemoteEvent, pushRemoteEvent } from "./event-remote";
import { patchRemotePhoto, pushRemotePhoto } from "./photo-remote";
import { getPublicEvent } from "./public-events";
import { getGuestUploadQuota } from "./photo-limits";
import {
  generateDefaultHashtag,
  generateEventSlug,
  isEventJoinable,
  isEventUploadsAllowed,
} from "./event-utils";
import {
  clearAllUploadMedia,
  deleteUploadMedia,
  deleteUploadMediaBatch,
  getUploadMedia,
  saveUploadMedia,
} from "./upload-media-store";

const EVENTS_KEY = "wedding-pov-events";
const GUESTS_KEY = "wedding-pov-guests";
const UPLOADS_KEY = "wedding-pov-uploads";
const SESSION_KEY = "wedding-pov-session";
const TEMPLATES_KEY = "wedding-pov-templates";

type PersistedUpload = Omit<Upload, "imageData"> & { imageData?: string };

const uploadMediaCache = new Map<string, string>();
let uploadsHydrated = false;
let uploadsHydratePromise: Promise<void> | null = null;

function isPersistedSampleUrl(imageData?: string): boolean {
  return Boolean(imageData?.startsWith("/sample-photos/"));
}

function stripImageData(upload: Upload | PersistedUpload): PersistedUpload {
  const { imageData, ...meta } = upload as Upload;
  if (isPersistedSampleUrl(imageData)) {
    return { ...meta, imageData };
  }
  return meta;
}

function enrichUpload(record: PersistedUpload): Upload {
  return {
    ...record,
    imageData: uploadMediaCache.get(record.id) ?? record.imageData ?? "",
  };
}

function readPersistedUploads(): PersistedUpload[] {
  return read<PersistedUpload[]>(UPLOADS_KEY, []);
}

function writePersistedUploads(records: PersistedUpload[]): boolean {
  return write(UPLOADS_KEY, records.map(stripImageData));
}

/** Move legacy inline photos to IndexedDB and strip them from localStorage metadata. */
async function compactPersistedUploads(records: PersistedUpload[]): Promise<PersistedUpload[]> {
  const next: PersistedUpload[] = [];

  for (const record of records) {
    if (record.imageData && record.imageData.length > 32 && !isPersistedSampleUrl(record.imageData)) {
      const ok = await saveUploadMedia(record.id, record.imageData);
      uploadMediaCache.set(record.id, record.imageData);
      if (!ok) {
        console.warn("[WeddingPOV] Could not move legacy upload to IndexedDB:", record.id);
      }
    }
    next.push(stripImageData(record));
  }

  writePersistedUploads(next);
  return next;
}

/** Load photo blobs from IndexedDB (and migrate legacy localStorage blobs). */
export async function ensureUploadsHydrated(): Promise<void> {
  if (typeof window === "undefined") return;
  if (uploadsHydrated) return;
  if (uploadsHydratePromise) return uploadsHydratePromise;

  uploadsHydratePromise = (async () => {
    let records = await compactPersistedUploads(readPersistedUploads());

    await Promise.all(
      records.map(async (record) => {
        if (uploadMediaCache.has(record.id)) return;
        const media = await getUploadMedia(record.id);
        if (media) uploadMediaCache.set(record.id, media);
      })
    );

    uploadsHydrated = true;
    window.dispatchEvent(new CustomEvent("wedding-pov:uploads-ready"));
  })().finally(() => {
    uploadsHydratePromise = null;
  });

  return uploadsHydratePromise;
}

if (typeof window !== "undefined") {
  void ensureUploadsHydrated();
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error("[WeddingPOV] Storage write failed:", err);
    return false;
  }
}

function mergeHeroSettings(raw?: Partial<HeroSettings>): HeroSettings {
  const h = raw ?? {};
  return {
    ...DEFAULT_HERO,
    ...h,
    backgroundImages: Array.isArray(h.backgroundImages) ? h.backgroundImages : DEFAULT_HERO.backgroundImages,
    imagePosition: { ...DEFAULT_HERO.imagePosition, ...(h.imagePosition ?? {}) },
    overlayGradient: { ...DEFAULT_HERO.overlayGradient, ...(h.overlayGradient ?? {}) },
    textColors: { ...DEFAULT_HERO_TEXT_COLORS, ...(h.textColors ?? {}) },
  };
}

function migrateEvent(raw: Partial<WeddingEvent> & { id: string }): WeddingEvent {
  const settings: EventSettings = raw.settings ?? {
    ...DEFAULT_EVENT_SETTINGS,
    brideName: raw.coupleName?.split(" & ")[0]?.replace("Prillaga & Co.", "Jane") ?? "Jane",
    groomName: raw.coupleName?.split(" & ")[1] ?? "John",
    weddingDate: raw.weddingDate ?? DEFAULT_EVENT_SETTINGS.weddingDate,
    venue: raw.venue ?? DEFAULT_EVENT_SETTINGS.venue,
  };

  return {
    id: raw.id,
    coupleName:
      raw.coupleName ??
      `${settings.brideName} & ${settings.groomName}`,
    weddingDate: raw.weddingDate ?? settings.weddingDate,
    venue: raw.venue ?? settings.venue,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    status: raw.status ?? "active",
    archivedAt: raw.archivedAt,
    pin: raw.pin,
    settings,
    photoLimits: raw.photoLimits ?? { ...DEFAULT_PHOTO_LIMITS },
    videoLimits: { ...DEFAULT_VIDEO_LIMITS, ...(raw.videoLimits ?? {}) },
    theme: {
      ...DEFAULT_THEME,
      ...(raw.theme ?? {}),
      colors: { ...DEFAULT_THEME.colors, ...(raw.theme?.colors ?? {}) },
      screenBackgrounds: {
        ...DEFAULT_SCREEN_BACKGROUNDS,
        ...(raw.theme?.screenBackgrounds ?? {}),
      },
      hero: mergeHeroSettings(raw.theme?.hero),
    },
    slideshow: {
      ...DEFAULT_SLIDESHOW,
      ...(raw.slideshow ?? {}),
      intro: { ...DEFAULT_SLIDESHOW.intro, ...(raw.slideshow?.intro ?? {}) },
      outro: { ...DEFAULT_SLIDESHOW.outro, ...(raw.slideshow?.outro ?? {}) },
      music: { ...DEFAULT_SLIDESHOW.music, ...(raw.slideshow?.music ?? {}) },
    },
    moderation: raw.moderation ?? { ...DEFAULT_MODERATION },
    photoManagement: { ...DEFAULT_PHOTO_MANAGEMENT, ...(raw.photoManagement ?? {}) },
  };
}

export function seedDemoEvent(): WeddingEvent {
  const existing = getEvents().find((e) => e.id === DEMO_EVENT_ID);
  if (existing) return existing;

  const event = getHardcodedDemoEvent();
  write(EVENTS_KEY, [...getEvents(), event]);
  return event;
}

export function getEvents(): WeddingEvent[] {
  try {
    return read<Partial<WeddingEvent>[]>(EVENTS_KEY, [])
      .filter((e): e is Partial<WeddingEvent> & { id: string } => Boolean(e?.id))
      .map((e) => migrateEvent(e));
  } catch {
    write(EVENTS_KEY, []);
    return [];
  }
}

/** Clear broken saved data — safe recovery for stuck/blank screens. */
export function resetAppData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(EVENTS_KEY);
  localStorage.removeItem(GUESTS_KEY);
  localStorage.removeItem(UPLOADS_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TEMPLATES_KEY);
  uploadMediaCache.clear();
  uploadsHydrated = false;
  void clearAllUploadMedia();
}

export function getEvent(eventId: string): WeddingEvent | undefined {
  const id = normalizeEventId(eventId);
  if (isDemoEventId(id)) {
    return getEvents().find((e) => e.id === id) ?? getHardcodedDemoEvent();
  }
  return getEvents().find((e) => e.id === id);
}

function cacheEventLocally(event: WeddingEvent): WeddingEvent {
  const events = getEvents();
  const exists = events.some((e) => e.id === event.id);
  if (exists) {
    write(
      EVENTS_KEY,
      events.map((e) => (e.id === event.id ? event : e))
    );
  } else {
    write(EVENTS_KEY, [...events, event]);
  }
  return event;
}

/** Resolve event on any device — always merge cloud config (incl. music) with local cache. */
export async function loadEventForGuest(eventId: string): Promise<WeddingEvent | null> {
  const id = toCanonicalEventId(eventId);
  if (!id) return null;

  let base: WeddingEvent | null = null;

  const bootstrap = readBootstrapFromLocation();
  if (bootstrap && normalizeEventId(bootstrap.id) === id) {
    base = bootstrap;
  }

  if (!base) {
    const sessionEvent = readEventFromSession(id);
    if (sessionEvent) base = sessionEvent;
  }

  if (!base) {
    base = getEvents().find((e) => e.id === id) ?? null;
  }

  const remote = await fetchRemoteEvent(id);

  if (remote && base) {
    return cacheEventLocally(mergeGuestEventConfig(base, remote));
  }
  if (remote) {
    return cacheEventLocally(remote);
  }
  if (base) {
    return cacheEventLocally(base);
  }

  if (isDemoEventId(id)) {
    return cacheEventLocally(getHardcodedDemoEvent());
  }

  const published = getPublicEvent(id);
  if (published) {
    return cacheEventLocally(published);
  }

  return null;
}

function mergeSlideshowMusic(
  local?: SlideshowMusicSettings,
  remote?: SlideshowMusicSettings
): SlideshowMusicSettings {
  const merged = {
    ...DEFAULT_SLIDESHOW.music,
    ...(local ?? {}),
    ...(remote ?? {}),
  };
  const trackUrl = remote?.trackUrl || local?.trackUrl;
  const trackName = remote?.trackName || local?.trackName;
  return {
    ...merged,
    trackUrl,
    trackName,
    enabled: Boolean(trackUrl && (remote?.enabled || local?.enabled)),
    bpm: remote?.bpm ?? local?.bpm ?? merged.bpm,
    syncToBeat: remote?.syncToBeat ?? local?.syncToBeat ?? merged.syncToBeat,
    volume: remote?.volume ?? local?.volume ?? merged.volume,
  };
}

function mergeGuestEventConfig(local: WeddingEvent, remote: WeddingEvent): WeddingEvent {
  return migrateEvent({
    ...local,
    ...remote,
    slideshow: {
      ...local.slideshow,
      ...remote.slideshow,
      intro: { ...local.slideshow.intro, ...remote.slideshow.intro },
      outro: { ...local.slideshow.outro, ...remote.slideshow.outro },
      music: mergeSlideshowMusic(local.slideshow?.music, remote.slideshow?.music),
    },
  });
}

export function saveEvent(event: WeddingEvent): void {
  write(
    EVENTS_KEY,
    getEvents().map((e) => (e.id === event.id ? event : e))
  );
  void pushRemoteEvent(event);
}

export function updateEventSettings(eventId: string, settings: Partial<EventSettings>): void {
  const event = getEvent(eventId);
  if (!event) return;
  const merged = { ...event.settings, ...settings };
  saveEvent({
    ...event,
    settings: merged,
    coupleName: `${merged.groomName} & ${merged.brideName}`,
    weddingDate: merged.weddingDate,
    venue: merged.venue,
  });
}

export function updatePhotoLimits(eventId: string, limits: Partial<PhotoLimitSettings>): void {
  const event = getEvent(eventId);
  if (!event) return;
  saveEvent({ ...event, photoLimits: { ...event.photoLimits, ...limits } });
}

export function updateVideoLimits(eventId: string, limits: Partial<VideoLimitSettings>): void {
  const event = getEvent(eventId);
  if (!event) return;
  saveEvent({ ...event, videoLimits: { ...event.videoLimits, ...limits } });
}

export function updateTheme(eventId: string, theme: ThemeSettingsPatch): void {
  const event = getEvent(eventId);
  if (!event) return;
  saveEvent({
    ...event,
    theme: {
      ...event.theme,
      ...theme,
      colors: theme.colors ? { ...event.theme.colors, ...theme.colors } : event.theme.colors,
      screenBackgrounds: theme.screenBackgrounds
        ? { ...event.theme.screenBackgrounds, ...theme.screenBackgrounds }
        : event.theme.screenBackgrounds,
      hero: theme.hero ? { ...event.theme.hero, ...theme.hero } : event.theme.hero,
    },
  });
}

export function updateSlideshow(eventId: string, slideshow: Partial<SlideshowConfig>): void {
  const event = getEvent(eventId);
  if (!event) return;
  saveEvent({ ...event, slideshow: { ...event.slideshow, ...slideshow } });
}

export function updateModeration(eventId: string, moderation: Partial<ModerationSettings>): void {
  const event = getEvent(eventId);
  if (!event) return;
  saveEvent({ ...event, moderation: { ...event.moderation, ...moderation } });
}

export function updatePhotoManagement(
  eventId: string,
  settings: Partial<PhotoManagementSettings>
): void {
  const event = getEvent(eventId);
  if (!event) return;
  saveEvent({
    ...event,
    photoManagement: { ...event.photoManagement, ...settings },
  });
}

export function createEvent(data: Omit<WeddingEvent, "id" | "createdAt">): WeddingEvent {
  const event = migrateEvent({
    ...data,
    id: uuidv4().slice(0, 8),
    createdAt: new Date().toISOString(),
  });
  write(EVENTS_KEY, [...getEvents(), event]);
  return event;
}

export interface CreateWeddingEventInput {
  brideName: string;
  groomName: string;
  weddingDate: string;
  venue: string;
  hashtag?: string;
  welcomeMessage?: string;
  maxPhotos?: PhotoLimitValue;
  maxVideoDurationSeconds?: VideoLimitSettings["maxDurationSeconds"];
  themePreset?: ThemePreset;
  couplePhoto?: string;
}

export function createWeddingEvent(input: CreateWeddingEventInput): WeddingEvent {
  const settings: EventSettings = {
    brideName: input.brideName.trim(),
    groomName: input.groomName.trim(),
    weddingDate: input.weddingDate,
    venue: input.venue.trim(),
    hashtag: input.hashtag?.trim() || generateDefaultHashtag(input),
    welcomeMessage: input.welcomeMessage?.trim() ?? "",
  };

  const preset = input.themePreset ?? "champagne";
  const id = generateEventSlug(
    settings,
    getEvents().map((e) => e.id)
  );

  const event = migrateEvent({
    id,
    coupleName: `${settings.groomName} & ${settings.brideName}`,
    weddingDate: settings.weddingDate,
    venue: settings.venue,
    createdAt: new Date().toISOString(),
    status: "active",
    settings,
    photoLimits: {
      ...DEFAULT_PHOTO_LIMITS,
      enabled: true,
      maxPhotos: input.maxPhotos ?? 25,
    },
    videoLimits: {
      ...DEFAULT_VIDEO_LIMITS,
      maxDurationSeconds: input.maxVideoDurationSeconds ?? DEFAULT_VIDEO_LIMITS.maxDurationSeconds,
    },
    theme: {
      ...DEFAULT_THEME,
      preset,
      colors: THEME_PRESETS[preset].colors,
      backgroundImage: input.couplePhoto,
      hero: {
        ...DEFAULT_HERO,
        couplePhoto: input.couplePhoto,
        backgroundImages: input.couplePhoto ? [input.couplePhoto] : [],
      },
    },
    slideshow: {
      ...DEFAULT_SLIDESHOW,
      intro: {
        title: `${settings.groomName} & ${settings.brideName}`,
        subtitle: "Wedding Memories",
        line3: "Captured By Family & Friends",
        date: new Date(settings.weddingDate).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      },
      outro: {
        title: "Thank You",
        subtitle: "For Celebrating With Us",
        line3: `${settings.groomName} & ${settings.brideName}`,
      },
    },
    moderation: { ...DEFAULT_MODERATION },
    photoManagement: { ...DEFAULT_PHOTO_MANAGEMENT, afterUploadBehavior: "stay-in-camera" },
  });

  write(EVENTS_KEY, [...getEvents(), event]);
  void pushRemoteEvent(event);
  return event;
}

export { isEventJoinable, isEventUploadsAllowed };

export function getGuests(eventId?: string): Guest[] {
  const guests = read<(Guest & { eventId?: string })[]>(GUESTS_KEY, []);
  return eventId ? guests.filter((g) => g.eventId === eventId) : guests;
}

function normalizeGuestName(name: string): string {
  return name.trim().toLowerCase();
}

export function findGuestByName(
  eventId: string,
  firstName: string,
  lastName: string
): (Guest & { eventId?: string }) | undefined {
  const id = normalizeEventId(eventId);
  const fn = normalizeGuestName(firstName);
  const ln = normalizeGuestName(lastName);
  return read<(Guest & { eventId?: string })[]>(GUESTS_KEY, []).find(
    (g) =>
      g.eventId === id &&
      normalizeGuestName(g.firstName) === fn &&
      normalizeGuestName(g.lastName) === ln
  );
}

export function registerGuest(
  eventId: string,
  data: Pick<Guest, "firstName" | "lastName" | "relationship">
): Guest {
  const id = normalizeEventId(eventId);
  const event = getEvent(id) ?? (isDemoEventId(id) ? seedDemoEvent() : undefined);
  if (!event || !isEventJoinable(event)) {
    throw new Error("This wedding is not accepting guests right now.");
  }

  const trimmed = {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    relationship: data.relationship,
  };

  const existing = findGuestByName(id, trimmed.firstName, trimmed.lastName);
  if (existing) {
    setSession({ eventId: id, guestId: existing.id });
    return existing;
  }

  const guest: Guest & { eventId: string } = {
    id: uuidv4(),
    ...trimmed,
    joinedAt: new Date().toISOString(),
    eventId: id,
  };
  write(GUESTS_KEY, [...read<(Guest & { eventId?: string })[]>(GUESTS_KEY, []), guest]);
  setSession({ eventId: id, guestId: guest.id });
  return guest;
}

export function getGuest(guestId: string): (Guest & { eventId?: string }) | undefined {
  return read<(Guest & { eventId?: string })[]>(GUESTS_KEY, []).find((g) => g.id === guestId);
}

export function updateGuest(
  guestId: string,
  eventId: string,
  data: Pick<Guest, "firstName" | "lastName">
): boolean {
  const guests = read<(Guest & { eventId?: string })[]>(GUESTS_KEY, []);
  const index = guests.findIndex((g) => g.id === guestId && g.eventId === eventId);
  if (index < 0) return false;

  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  if (!firstName || !lastName) return false;

  guests[index] = { ...guests[index], firstName, lastName };
  write(GUESTS_KEY, guests);

  const guestName = `${firstName} ${lastName}`;
  writePersistedUploads(
    readPersistedUploads().map((upload) =>
      upload.guestId === guestId && upload.eventId === eventId
        ? { ...upload, guestName }
        : upload
    )
  );

  return true;
}

function purgeGuestUploads(guestId: string, eventId: string): void {
  const records = readPersistedUploads();
  const removed = records.filter((u) => u.guestId === guestId && u.eventId === eventId);
  const kept = records.filter((u) => !(u.guestId === guestId && u.eventId === eventId));

  removed.forEach((u) => uploadMediaCache.delete(u.id));
  void deleteUploadMediaBatch(removed.map((u) => u.id));
  writePersistedUploads(kept);
}

export function removeGuest(guestId: string, eventId: string): boolean {
  const guests = read<(Guest & { eventId?: string })[]>(GUESTS_KEY, []);
  const next = guests.filter((g) => !(g.id === guestId && g.eventId === eventId));
  if (next.length === guests.length) return false;

  write(GUESTS_KEY, next);
  purgeGuestUploads(guestId, eventId);

  const session = getSession();
  if (session?.guestId === guestId && session.eventId === eventId) {
    clearSession();
  }

  return true;
}

export function resetGuestUploadCount(guestId: string, eventId: string): void {
  purgeGuestUploads(guestId, eventId);
}

export interface Session {
  eventId: string;
  guestId: string;
}

export function getSession(): Session | null {
  return read<Session | null>(SESSION_KEY, null);
}

export function setSession(session: Session): void {
  write(SESSION_KEY, session);
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function getUploads(eventId: string, includeRemoved = false): Upload[] {
  const id = toCanonicalEventId(eventId);
  return readPersistedUploads()
    .filter((u) => u.eventId === id && (includeRemoved || u.status !== "removed"))
    .map(enrichUpload)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** All uploads for quota counting, including slot-locked removed entries */
export function getAllUploadsForQuota(eventId: string): Upload[] {
  const id = toCanonicalEventId(eventId);
  return readPersistedUploads()
    .filter((u) => u.eventId === id)
    .map(enrichUpload);
}

export function getGuestUploads(eventId: string, guestId: string): Upload[] {
  return getUploads(eventId).filter((u) => u.guestId === guestId);
}

export function getApprovedUploads(eventId: string): Upload[] {
  return getUploads(eventId).filter(
    (u) => u.status === "approved" || u.status === "pending" || u.status === "extra"
  );
}

/** One-tap repair when uploads fail — frees localStorage by moving photos to IndexedDB. */
export async function repairGuestPhotoStorage(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  await compactPersistedUploads(readPersistedUploads());
  uploadsHydrated = true;
  return true;
}

export async function addUpload(
  data: Omit<Upload, "id" | "createdAt" | "status"> & { isExtra?: boolean }
): Promise<Upload | null> {
  const event = getEvent(data.eventId);
  if (event?.moderation.uploadsDisabled) return null;

  const id = uuidv4();
  let imageData = data.imageData;

  let savedMedia = await saveUploadMedia(id, imageData);
  if (!savedMedia && !data.isVideo) {
    try {
      const { compressImageForUpload } = await import("./image-utils");
      imageData = await compressImageForUpload(imageData, 960, 0.72);
      savedMedia = await saveUploadMedia(id, imageData);
    } catch {
      // keep original
    }
  }

  if (!savedMedia) return null;

  uploadMediaCache.set(id, imageData);

  const upload: Upload = {
    ...data,
    imageData,
    id,
    status: data.isExtra ? "extra" : event?.moderation.autoApprove ? "approved" : "pending",
    createdAt: new Date().toISOString(),
  };

  let records = await compactPersistedUploads(readPersistedUploads());
  records = records.filter((record) => record.id !== id);

  let saved = writePersistedUploads([stripImageData(upload), ...records]);
  if (!saved) {
    records = records.filter((record) => record.status !== "removed");
    saved = writePersistedUploads([stripImageData(upload), ...records]);
  }
  if (!saved) {
    records = await compactPersistedUploads(readPersistedUploads());
    records = records.filter((record) => record.id !== id);
    saved = writePersistedUploads([stripImageData(upload), ...records]);
  }

  if (!saved) {
    uploadMediaCache.delete(id);
    await deleteUploadMedia(id);
    return null;
  }

  void pushRemotePhoto(upload).catch((err) => {
    console.warn("[WeddingPOV] Cloud photo sync failed:", err);
  });

  return upload;
}

export function updateUploadStatus(uploadId: string, status: Upload["status"]): void {
  const records = readPersistedUploads();
  const upload = records.find((u) => u.id === uploadId);
  writePersistedUploads(
    records.map((u) => (u.id === uploadId ? { ...u, status } : u))
  );
  if (upload) {
    void patchRemotePhoto(upload.eventId, uploadId, { status });
  }
}

export function deleteUpload(uploadId: string): void {
  updateUploadStatus(uploadId, "removed");
}

export function deleteGuestUpload(
  uploadId: string,
  guestId: string,
  restoreSlot: boolean
): boolean {
  const records = readPersistedUploads();
  const upload = records.find((u) => u.id === uploadId && u.guestId === guestId);
  if (!upload || upload.status === "removed") return false;

  writePersistedUploads(
    records.map((u) =>
      u.id === uploadId
        ? { ...u, status: "removed" as const, slotLocked: !restoreSlot }
        : u
    )
  );

  if (restoreSlot) {
    uploadMediaCache.delete(uploadId);
    void deleteUploadMedia(uploadId);
  }

  void patchRemotePhoto(upload.eventId, uploadId, { status: "removed", guestId });

  return true;
}

export async function replaceUpload(
  uploadId: string,
  guestId: string,
  data: Pick<Upload, "imageData" | "caption" | "filter" | "segment"> & { isVideo?: boolean }
): Promise<boolean> {
  const records = readPersistedUploads();
  const upload = records.find((u) => u.id === uploadId && u.guestId === guestId);
  if (!upload || upload.status === "removed") return false;

  let imageData = data.imageData;
  let savedMedia = await saveUploadMedia(uploadId, imageData);
  if (!savedMedia && !data.isVideo) {
    try {
      const { compressImageForUpload } = await import("./image-utils");
      imageData = await compressImageForUpload(imageData, 960, 0.72);
      savedMedia = await saveUploadMedia(uploadId, imageData);
    } catch {
      // keep original
    }
  }
  if (!savedMedia) return false;

  uploadMediaCache.set(uploadId, imageData);

  const compacted = await compactPersistedUploads(records);
  const saved = writePersistedUploads(
    compacted.map((u) =>
      u.id === uploadId
        ? {
            ...u,
            caption: data.caption,
            filter: data.filter,
            segment: data.segment,
            isVideo: data.isVideo ?? u.isVideo,
          }
        : u
    )
  );

  if (saved) {
    const updated: Upload = {
      ...upload,
      ...data,
      imageData,
      isVideo: data.isVideo ?? upload.isVideo,
    };
    void pushRemotePhoto(updated);
  }

  return saved;
}

export function approveAllPending(eventId: string): void {
  const records = readPersistedUploads();
  writePersistedUploads(
    records.map((u) =>
      u.eventId === eventId && u.status === "pending"
        ? { ...u, status: "approved" as const }
        : u
    )
  );
}

export function getEventStats(eventId: string): EventStats {
  const event = getEvent(eventId);
  const uploads = getUploads(eventId);
  const guests = getGuests(eventId);
  const active = uploads.filter((u) => u.status !== "removed");
  const segments: EventSegment[] = [
    "ceremony",
    "cocktails",
    "reception",
    "first-dance",
    "speeches",
    "other",
  ];

  const uploadsBySegment = segments.reduce(
    (acc, seg) => {
      acc[seg] = active.filter((u) => u.segment === seg).length;
      return acc;
    },
    {} as Record<EventSegment, number>
  );

  const uploadsByGuest: Record<string, number> = {};
  active.forEach((u) => {
    uploadsByGuest[u.guestName] = (uploadsByGuest[u.guestName] ?? 0) + 1;
  });

  const topContributors = Object.entries(uploadsByGuest)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const recentUploads = active.slice(0, 8);

  const mostViewedPhotos = active
    .map((upload, index) => ({
      upload,
      views: Math.max(1, active.length - index + (upload.guestName.length % 7) * 3),
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  const guestLimits = guests.map((guest) => {
    const quota = getGuestUploadQuota(
      event?.photoLimits ?? DEFAULT_PHOTO_LIMITS,
      getAllUploadsForQuota(eventId),
      guest.id
    );
    return {
      guestId: guest.id,
      guestName: `${guest.firstName} ${guest.lastName}`,
      used: quota.used,
      max: quota.max,
      remaining: quota.remaining,
      isAtLimit: quota.isAtLimit,
    };
  });

  const storageUsedMB =
    Math.round(
      active.reduce((sum, u) => sum + (u.imageData?.length ?? 0) * 0.75, 0) / (1024 * 1024) * 10
    ) / 10;

  return {
    totalUploads: active.length,
    totalGuests: guests.length,
    averagePhotosPerGuest:
      guests.length > 0 ? Math.round((active.length / guests.length) * 10) / 10 : 0,
    storageUsedMB: Math.max(storageUsedMB, active.length * 0.5),
    uploadsBySegment,
    uploadsByGuest,
    topContributors,
    recentUploads,
    mostViewedPhotos,
    guestLimits,
  };
}

export function getTemplates(): AdminTemplate[] {
  return read<AdminTemplate[]>(TEMPLATES_KEY, []);
}

export function saveTemplate(
  eventId: string,
  name: string,
  type: AdminTemplate["type"]
): AdminTemplate | null {
  const event = getEvent(eventId);
  if (!event) return null;

  const template: AdminTemplate = {
    id: uuidv4().slice(0, 8),
    name,
    type,
    createdAt: new Date().toISOString(),
    theme:
      type === "theme" || type === "full"
        ? { ...event.theme }
        : type === "colors"
          ? { colors: { ...event.theme.colors } }
          : type === "backgrounds"
            ? {
                screenBackgrounds: { ...event.theme.screenBackgrounds },
                hero: { ...event.theme.hero },
                backgroundImage: event.theme.backgroundImage,
                backgroundMode: event.theme.backgroundMode,
              }
            : undefined,
    photoLimits: type === "limits" || type === "full" ? { ...event.photoLimits } : undefined,
  };

  write(TEMPLATES_KEY, [...read<AdminTemplate[]>(TEMPLATES_KEY, []), template]);
  return template;
}

export function applyTemplate(eventId: string, templateId: string): boolean {
  const template = read<AdminTemplate[]>(TEMPLATES_KEY, []).find((t) => t.id === templateId);
  const event = getEvent(eventId);
  if (!template || !event) return false;

  if (template.theme) updateTheme(eventId, template.theme);
  if (template.photoLimits) updatePhotoLimits(eventId, template.photoLimits);
  return true;
}

export function deleteTemplate(templateId: string): void {
  write(
    TEMPLATES_KEY,
    read<AdminTemplate[]>(TEMPLATES_KEY, []).filter((t) => t.id !== templateId)
  );
}

export async function seedSampleUploads(eventId: string, force = false): Promise<void> {
  if (typeof window === "undefined") return;
  const id = toCanonicalEventId(eventId);
  if (!isDemoEventId(id)) return;

  if (!force && localStorage.getItem(DEMO_SAMPLE_GALLERY_CLEARED_KEY) === "1") {
    return;
  }

  seedDemoEvent();

  const storedVersion = Number(localStorage.getItem(DEMO_SAMPLE_GALLERY_VERSION_KEY) ?? 0);
  const sampleIds = new Set(DEMO_SAMPLE_PHOTOS.map((p) => p.id));
  const demoUploads = getUploads(id);
  const onlySampleUploads =
    demoUploads.length === DEMO_SAMPLE_PHOTOS.length &&
    demoUploads.every((u) => sampleIds.has(u.id)) &&
    demoUploads.every((u) => isPersistedSampleUrl(u.imageData));

  if (!force && storedVersion === DEMO_SAMPLE_GALLERY_VERSION && onlySampleUploads) {
    return;
  }

  clearAllDemoGalleryUploads(id);

  const allGuests = [
    ...DEMO_SAMPLE_PHOTOS.map((p) => ({
      id: p.guestId,
      firstName: p.firstName,
      lastName: p.lastName,
    })),
    ...DEMO_SAMPLE_GUEST_NAMES.map((g) => ({
      id: g.id,
      firstName: g.firstName,
      lastName: g.lastName,
    })),
  ];

  const existingGuests = read<(Guest & { eventId?: string })[]>(GUESTS_KEY, []);
  const otherGuests = existingGuests.filter((g) => g.eventId !== id);
  const demoGuests = allGuests.map((g) => ({
    ...g,
    eventId: id,
    joinedAt: demoSampleCreatedAt("16:30"),
  }));
  write(GUESTS_KEY, [...otherGuests, ...demoGuests]);

  try {
    const otherUploads = readPersistedUploads().filter((r) => r.eventId !== id);
    const sampleUploads: Upload[] = DEMO_SAMPLE_PHOTOS.map((sample) => {
      const guestName = `${sample.firstName} ${sample.lastName}`;
      uploadMediaCache.set(sample.id, sample.imagePath);
      return {
        id: sample.id,
        eventId: id,
        guestId: sample.guestId,
        guestName,
        imageData: sample.imagePath,
        caption: sample.caption,
        segment: sample.segment,
        filter: "warm-wedding" as const,
        isVideo: false,
        status: "approved" as const,
        createdAt: demoSampleCreatedAt(sample.time),
      };
    });

    writePersistedUploads([...sampleUploads, ...otherUploads]);
    localStorage.setItem(DEMO_SAMPLE_GALLERY_VERSION_KEY, String(DEMO_SAMPLE_GALLERY_VERSION));
    localStorage.removeItem(DEMO_SAMPLE_GALLERY_CLEARED_KEY);
    window.dispatchEvent(new CustomEvent("wedding-pov:uploads-ready"));
  } catch (err) {
    console.warn("[WeddingPOV] Demo sample photos could not be seeded:", err);
  }
}

/** Wipe JJ2027 gallery and block sample photo auto-seed until restored from admin. */
export function clearDemoGallery(): number {
  if (typeof window === "undefined") return 0;
  const removed = getUploads(DEMO_EVENT_ID).length;
  clearAllDemoGalleryUploads(DEMO_EVENT_ID);
  localStorage.setItem(DEMO_SAMPLE_GALLERY_CLEARED_KEY, "1");
  localStorage.setItem(DEMO_SAMPLE_GALLERY_VERSION_KEY, "0");
  window.dispatchEvent(new CustomEvent("wedding-pov:uploads-ready"));
  return removed;
}

/** Remove every upload for the JJ2027 demo — gallery is replaced with sample photos only. */
function clearAllDemoGalleryUploads(eventId: string): void {
  const records = readPersistedUploads();
  const removed = records.filter((u) => u.eventId === eventId);
  removed.forEach((u) => {
    uploadMediaCache.delete(u.id);
    void deleteUploadMedia(u.id);
  });
  writePersistedUploads(records.filter((u) => u.eventId !== eventId));
  write(
    GUESTS_KEY,
    read<(Guest & { eventId?: string })[]>(GUESTS_KEY, []).filter((g) => g.eventId !== eventId)
  );
}

export function getActiveEvents(): WeddingEvent[] {
  return getEvents().filter((e) => e.status !== "archived");
}

export function getManageableEvents(): WeddingEvent[] {
  return getEvents().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getArchivedEvents(): WeddingEvent[] {
  return getEvents().filter((e) => e.status === "archived");
}

export function archiveEvent(eventId: string): boolean {
  const event = getEvent(eventId);
  if (!event || event.status === "archived") return false;
  saveEvent({ ...event, status: "archived", archivedAt: new Date().toISOString() });
  return true;
}

export function pauseEvent(eventId: string): boolean {
  const event = getEvent(eventId);
  if (!event || event.status === "archived") return false;
  saveEvent({ ...event, status: "paused" });
  return true;
}

export function activateEvent(eventId: string): boolean {
  const event = getEvent(eventId);
  if (!event) return false;
  saveEvent({ ...event, status: "active", archivedAt: undefined });
  return true;
}

export function restoreEvent(eventId: string): boolean {
  const event = getEvent(eventId);
  if (!event || event.status !== "archived") return false;
  saveEvent({ ...event, status: "active", archivedAt: undefined });
  return true;
}

export function clearEventGuestData(eventId: string): void {
  const records = readPersistedUploads();
  const removed = records.filter((u) => u.eventId === eventId);
  writePersistedUploads(records.filter((u) => u.eventId !== eventId));
  removed.forEach((u) => uploadMediaCache.delete(u.id));
  void deleteUploadMediaBatch(removed.map((u) => u.id));
  write(
    GUESTS_KEY,
    read<(Guest & { eventId?: string })[]>(GUESTS_KEY, []).filter((g) => g.eventId !== eventId)
  );
}

export function deleteEventPermanently(eventId: string): boolean {
  if (eventId === DEMO_EVENT_ID) return false;
  clearEventGuestData(eventId);
  write(
    EVENTS_KEY,
    getEvents().filter((e) => e.id !== eventId)
  );
  return true;
}

/** Remove every event except the JJ2027 sample (prillaga-wedding-2026). Frees storage. */
export function cleanupAllEventsExceptDemo(): { removed: number; kept: string } {
  if (typeof window === "undefined") {
    return { removed: 0, kept: DEMO_EVENT_ID };
  }

  const events = getEvents();
  const toRemove = events.filter((e) => !isDemoEventId(e.id));

  for (const event of toRemove) {
    clearEventGuestData(event.id);
  }

  const demo = events.find((e) => isDemoEventId(e.id)) ?? getHardcodedDemoEvent();
  write(EVENTS_KEY, [demo]);

  clearAllDemoGalleryUploads(DEMO_EVENT_ID);

  write(
    TEMPLATES_KEY,
    getTemplates().filter((t) => t.eventId === DEMO_EVENT_ID)
  );

  const session = getSession();
  if (session && !isDemoEventId(session.eventId)) {
    clearSession();
  }

  localStorage.setItem(DEMO_SAMPLE_GALLERY_VERSION_KEY, "0");
  void seedSampleUploads(DEMO_EVENT_ID, true);
  return { removed: toRemove.length, kept: DEMO_EVENT_ID };
}

export function resetEventForNewWedding(
  eventId: string,
  settings?: Partial<EventSettings>
): WeddingEvent | null {
  const event = getEvent(eventId);
  if (!event) return null;

  clearEventGuestData(eventId);

  const mergedSettings = settings ? { ...event.settings, ...settings } : event.settings;
  const updated: WeddingEvent = {
    ...event,
    status: "active",
    archivedAt: undefined,
    settings: mergedSettings,
    coupleName: `${mergedSettings.brideName} & ${mergedSettings.groomName}`,
    weddingDate: mergedSettings.weddingDate,
    venue: mergedSettings.venue,
    createdAt: new Date().toISOString(),
  };
  saveEvent(updated);
  return updated;
}

export function createNewWeddingEvent(
  sourceEventId: string,
  settings: Partial<EventSettings>
): WeddingEvent | null {
  const source = getEvent(sourceEventId);
  if (!source) return null;

  archiveEvent(sourceEventId);

  const merged = { ...source.settings, ...settings };
  const preset = source.theme.preset !== "custom" ? source.theme.preset : "champagne";

  return createWeddingEvent({
    brideName: merged.brideName,
    groomName: merged.groomName,
    weddingDate: merged.weddingDate,
    venue: merged.venue,
    hashtag: merged.hashtag,
    welcomeMessage: merged.welcomeMessage,
    maxPhotos: source.photoLimits.maxPhotos,
    themePreset: preset,
    couplePhoto: source.theme.hero.couplePhoto ?? source.theme.backgroundImage,
  });
}

export function getStorageDashboard(): StorageDashboardStats {
  const events = getEvents();
  const uploads = readPersistedUploads().map(enrichUpload);
  const activeUploads = uploads.filter((u) => u.status !== "removed");
  const storageBytes = activeUploads.reduce(
    (sum, u) => sum + (u.imageData?.length ?? 0) * 0.75,
    0
  );

  return {
    totalPhotos: activeUploads.length,
    storageUsedGB: Math.round((storageBytes / (1024 * 1024 * 1024)) * 10) / 10,
    storageLimitGB: STORAGE_PLAN_GB,
    activeEvents: events.filter((e) => e.status !== "archived").length,
    archivedEvents: events.filter((e) => e.status === "archived").length,
  };
}

export function ensureEvent(eventId: string): WeddingEvent | undefined {
  const id = normalizeEventId(eventId);
  if (isDemoEventId(id)) {
    seedDemoEvent();
    return getEvent(id) ?? getHardcodedDemoEvent();
  }
  return getEvent(id);
}
