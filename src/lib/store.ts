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
  SlideshowConfig,
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
  DEFAULT_SCREEN_BACKGROUNDS,
  DEFAULT_SLIDESHOW,
  DEFAULT_THEME,
  DEMO_EVENT_ID,
  STORAGE_PLAN_GB,
  THEME_PRESETS,
} from "./constants";
import { getHardcodedDemoEvent, isDemoEventId, normalizeEventId } from "./demo-event";
import { readBootstrapFromLocation } from "./event-bootstrap";
import { fetchRemoteEvent, pushRemoteEvent } from "./event-remote";
import { getGuestUploadQuota } from "./photo-limits";
import {
  generateDefaultHashtag,
  generateEventSlug,
  isEventJoinable,
  isEventUploadsAllowed,
} from "./event-utils";
import { formatGuestNamePOV } from "./utils";

const EVENTS_KEY = "wedding-pov-events";
const GUESTS_KEY = "wedding-pov-guests";
const UPLOADS_KEY = "wedding-pov-uploads";
const SESSION_KEY = "wedding-pov-session";
const TEMPLATES_KEY = "wedding-pov-templates";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
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

/** Resolve event on any device — local cache, built-in demo, then cloud API. */
export async function loadEventForGuest(eventId: string): Promise<WeddingEvent | null> {
  const id = normalizeEventId(eventId);
  if (!id) return null;

  const bootstrap = readBootstrapFromLocation();
  if (bootstrap && normalizeEventId(bootstrap.id) === id) {
    return cacheEventLocally(bootstrap);
  }

  const local = getEvents().find((e) => e.id === id);
  if (local) return local;

  if (isDemoEventId(id)) {
    return cacheEventLocally(getHardcodedDemoEvent());
  }

  const remote = await fetchRemoteEvent(id);
  if (remote) {
    return cacheEventLocally(remote);
  }

  return null;
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

export function registerGuest(
  eventId: string,
  data: Pick<Guest, "firstName" | "lastName" | "relationship">
): Guest {
  const id = normalizeEventId(eventId);
  const event = getEvent(id) ?? (isDemoEventId(id) ? seedDemoEvent() : undefined);
  if (!event || !isEventJoinable(event)) {
    throw new Error("This wedding is not accepting guests right now.");
  }

  const guest: Guest & { eventId: string } = {
    id: uuidv4(),
    ...data,
    joinedAt: new Date().toISOString(),
    eventId: id,
  };
  write(GUESTS_KEY, [...read<(Guest & { eventId?: string })[]>(GUESTS_KEY, []), guest]);
  setSession({ eventId, guestId: guest.id });
  return guest;
}

export function getGuest(guestId: string): (Guest & { eventId?: string }) | undefined {
  return read<(Guest & { eventId?: string })[]>(GUESTS_KEY, []).find((g) => g.id === guestId);
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
  const uploads = read<Upload[]>(UPLOADS_KEY, []);
  return uploads
    .filter((u) => u.eventId === eventId && (includeRemoved || u.status !== "removed"))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** All uploads for quota counting, including slot-locked removed entries */
export function getAllUploadsForQuota(eventId: string): Upload[] {
  return read<Upload[]>(UPLOADS_KEY, []).filter((u) => u.eventId === eventId);
}

export function getGuestUploads(eventId: string, guestId: string): Upload[] {
  return getUploads(eventId).filter((u) => u.guestId === guestId);
}

export function getApprovedUploads(eventId: string): Upload[] {
  return getUploads(eventId).filter(
    (u) => u.status === "approved" || u.status === "pending" || u.status === "extra"
  );
}

export function addUpload(
  data: Omit<Upload, "id" | "createdAt" | "status"> & { isExtra?: boolean }
): Upload | null {
  const event = getEvent(data.eventId);
  if (event?.moderation.uploadsDisabled) return null;

  const upload: Upload = {
    ...data,
    id: uuidv4(),
    status: data.isExtra ? "extra" : event?.moderation.autoApprove ? "approved" : "pending",
    createdAt: new Date().toISOString(),
  };
  const uploads = read<Upload[]>(UPLOADS_KEY, []);
  write(UPLOADS_KEY, [upload, ...uploads]);
  return upload;
}

export function updateUploadStatus(uploadId: string, status: Upload["status"]): void {
  const uploads = read<Upload[]>(UPLOADS_KEY, []);
  write(
    UPLOADS_KEY,
    uploads.map((u) => (u.id === uploadId ? { ...u, status } : u))
  );
}

export function deleteUpload(uploadId: string): void {
  updateUploadStatus(uploadId, "removed");
}

export function deleteGuestUpload(
  uploadId: string,
  guestId: string,
  restoreSlot: boolean
): boolean {
  const uploads = read<Upload[]>(UPLOADS_KEY, []);
  const upload = uploads.find((u) => u.id === uploadId && u.guestId === guestId);
  if (!upload || upload.status === "removed") return false;

  write(
    UPLOADS_KEY,
    uploads.map((u) =>
      u.id === uploadId
        ? { ...u, status: "removed" as const, slotLocked: !restoreSlot }
        : u
    )
  );
  return true;
}

export function replaceUpload(
  uploadId: string,
  guestId: string,
  data: Pick<Upload, "imageData" | "caption" | "filter" | "segment"> & { isVideo?: boolean }
): boolean {
  const uploads = read<Upload[]>(UPLOADS_KEY, []);
  const upload = uploads.find((u) => u.id === uploadId && u.guestId === guestId);
  if (!upload || upload.status === "removed") return false;

  write(
    UPLOADS_KEY,
    uploads.map((u) =>
      u.id === uploadId
        ? {
            ...u,
            imageData: data.imageData,
            caption: data.caption,
            filter: data.filter,
            segment: data.segment,
            isVideo: data.isVideo ?? u.isVideo,
          }
        : u
    )
  );
  return true;
}

export function approveAllPending(eventId: string): void {
  const uploads = read<Upload[]>(UPLOADS_KEY, []);
  write(
    UPLOADS_KEY,
    uploads.map((u) =>
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

export function seedSampleUploads(eventId: string): void {
  if (typeof document === "undefined") return;

  const existing = getUploads(eventId);
  if (existing.length > 0) return;

  const sampleGuests = [
    { id: "sample-0", firstName: "John", lastName: "Doe" },
    { id: "sample-1", firstName: "Jane", lastName: "Smith" },
    { id: "sample-2", firstName: "Michael", lastName: "Reyes" },
    { id: "sample-3", firstName: "Anna", lastName: "Cruz" },
    { id: "sample-4", firstName: "Maria", lastName: "Santos" },
  ];

  const segments: EventSegment[] = ["ceremony", "cocktails", "reception", "first-dance", "speeches"];
  const captions = [
    "Bride walking down the aisle",
    "Groom's reaction",
    "Wedding vows",
    "First kiss",
    "First dance",
  ];

  try {
    sampleGuests.forEach((guest, gi) => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = `hsl(${45 + gi * 40}, 35%, 85%)`;
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = "#2C2C2C";
      ctx.font = "italic 18px Georgia";
      ctx.textAlign = "center";
      ctx.fillText(captions[gi], 200, 140);
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#6B6560";
      ctx.fillText(formatGuestNamePOV(`${guest.firstName} ${guest.lastName}`), 200, 170);

      addUpload({
        eventId,
        guestId: guest.id,
        guestName: `${guest.firstName} ${guest.lastName}`,
        imageData: canvas.toDataURL("image/jpeg", 0.7),
        caption: captions[gi],
        segment: segments[gi],
        filter: "warm-wedding",
        isVideo: false,
      });
    });

    approveAllPending(eventId);
  } catch {
    // Sample data is optional — don't block guest join
  }
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
  write(
    UPLOADS_KEY,
    read<Upload[]>(UPLOADS_KEY, []).filter((u) => u.eventId !== eventId)
  );
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
  const uploads = read<Upload[]>(UPLOADS_KEY, []);
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
