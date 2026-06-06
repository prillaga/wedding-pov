import { normalizeEventId } from "@/lib/demo-event";
import type { Upload } from "@/types";
import { head, list, put } from "@vercel/blob";
import { getCloudStorageKind, isCloudStorageConfigured } from "./event-store";

const BLOB_PREFIX = "wedding-pov/events/";

export type StoredPhotoMeta = Omit<Upload, "imageData"> & { imageUrl: string };

function hasBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function photosIndexPath(eventId: string): string {
  return `${BLOB_PREFIX}${normalizeEventId(eventId)}/photos-index.json`;
}

function photoMetaPath(eventId: string, photoId: string): string {
  return `${BLOB_PREFIX}${normalizeEventId(eventId)}/photos/${photoId}.json`;
}

function photoMediaPath(eventId: string, photoId: string, ext: string): string {
  return `${BLOB_PREFIX}${normalizeEventId(eventId)}/media/${photoId}.${ext}`;
}

function photosListPrefix(eventId: string): string {
  return `${BLOB_PREFIX}${normalizeEventId(eventId)}/photos/`;
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; contentType: string; ext: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (!match) throw new Error("Invalid image data");
  const contentType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  let ext = "jpg";
  if (contentType.includes("webm")) ext = "webm";
  else if (contentType.includes("mp4")) ext = "mp4";
  else if (contentType.includes("png")) ext = "png";
  else if (contentType.includes("webp")) ext = "webp";
  return { buffer, contentType, ext };
}

function metaToUpload(meta: StoredPhotoMeta): Upload {
  return {
    ...meta,
    imageData: meta.imageUrl,
  };
}

async function readLegacyPhotosIndex(eventId: string): Promise<StoredPhotoMeta[]> {
  if (!hasBlob()) return [];
  try {
    const meta = await head(photosIndexPath(eventId), {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as StoredPhotoMeta[] | { photos?: StoredPhotoMeta[] };
    if (Array.isArray(data)) return data;
    return data.photos ?? [];
  } catch {
    return [];
  }
}

async function readPhotoMetaFile(url: string): Promise<StoredPhotoMeta | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as StoredPhotoMeta;
  } catch {
    return null;
  }
}

async function listPhotoMetaFiles(eventId: string): Promise<StoredPhotoMeta[]> {
  if (!hasBlob()) return [];

  const id = normalizeEventId(eventId);
  if (!id) return [];

  try {
    const { blobs } = await list({
      prefix: photosListPrefix(id),
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const jsonBlobs = blobs.filter(
      (blob) =>
        blob.pathname.endsWith(".json") &&
        !blob.pathname.endsWith("photos-index.json")
    );

    const metas = await Promise.all(jsonBlobs.map((blob) => readPhotoMetaFile(blob.url)));
    return metas.filter((meta): meta is StoredPhotoMeta => Boolean(meta?.id));
  } catch {
    return [];
  }
}

function mergePhotoMeta(entries: StoredPhotoMeta[]): StoredPhotoMeta[] {
  const byId = new Map<string, StoredPhotoMeta>();
  for (const entry of entries) {
    if (!entry.id || entry.status === "removed") continue;
    byId.set(entry.id, entry);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

async function writePhotoMeta(eventId: string, meta: StoredPhotoMeta): Promise<boolean> {
  if (!hasBlob()) return false;
  try {
    await put(photoMetaPath(eventId, meta.id), JSON.stringify(meta), {
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

export { isCloudStorageConfigured, getCloudStorageKind };

export async function listPhotosFromCloud(eventId: string): Promise<Upload[]> {
  const [fromFiles, fromLegacyIndex] = await Promise.all([
    listPhotoMetaFiles(eventId),
    readLegacyPhotosIndex(eventId),
  ]);

  return mergePhotoMeta([...fromLegacyIndex, ...fromFiles]).map(metaToUpload);
}

export async function addPhotoToCloud(upload: Upload): Promise<StoredPhotoMeta | null> {
  if (!hasBlob()) return null;

  const id = normalizeEventId(upload.eventId);
  if (!id || !upload.imageData) return null;

  let imageUrl = upload.imageData;

  if (!upload.imageData.startsWith("http")) {
    const { buffer, contentType, ext } = dataUrlToBuffer(upload.imageData);
    if (buffer.length > 4.5 * 1024 * 1024) {
      throw new Error("Photo too large for cloud upload");
    }

    const blob = await put(photoMediaPath(id, upload.id, ext), buffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
    });
    imageUrl = blob.url;
  }

  const meta: StoredPhotoMeta = {
    id: upload.id,
    eventId: id,
    guestId: upload.guestId,
    guestName: upload.guestName,
    caption: upload.caption,
    segment: upload.segment,
    filter: upload.filter,
    isVideo: upload.isVideo,
    status: upload.status,
    isExtra: upload.isExtra,
    slotLocked: upload.slotLocked,
    createdAt: upload.createdAt,
    imageUrl,
  };

  const ok = await writePhotoMeta(id, meta);
  return ok ? meta : null;
}

export async function updatePhotoInCloud(
  eventId: string,
  photoId: string,
  patch: Partial<Pick<Upload, "status" | "caption" | "segment" | "filter" | "isExtra" | "slotLocked">>
): Promise<boolean> {
  const id = normalizeEventId(eventId);
  if (!id) return false;

  const all = await listPhotoMetaFiles(id);
  let existing = all.find((photo) => photo.id === photoId);

  if (!existing) {
    const legacy = await readLegacyPhotosIndex(id);
    existing = legacy.find((photo) => photo.id === photoId);
  }

  if (!existing) return false;

  return writePhotoMeta(id, { ...existing, ...patch });
}
