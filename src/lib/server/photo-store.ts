import { normalizeEventId } from "@/lib/demo-event";
import type { Upload, UploadStatus } from "@/types";
import { head, put } from "@vercel/blob";
import { getCloudStorageKind, isCloudStorageConfigured } from "./event-store";

const BLOB_PREFIX = "wedding-pov/events/";

export type StoredPhotoMeta = Omit<Upload, "imageData"> & { imageUrl: string };

function hasBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function photosIndexPath(eventId: string): string {
  return `${BLOB_PREFIX}${normalizeEventId(eventId)}/photos-index.json`;
}

function photoMediaPath(eventId: string, photoId: string, ext: string): string {
  return `${BLOB_PREFIX}${normalizeEventId(eventId)}/media/${photoId}.${ext}`;
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

async function readPhotosIndex(eventId: string): Promise<StoredPhotoMeta[]> {
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

async function writePhotosIndex(eventId: string, photos: StoredPhotoMeta[]): Promise<boolean> {
  if (!hasBlob()) return false;
  try {
    await put(photosIndexPath(eventId), JSON.stringify(photos), {
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
  const index = await readPhotosIndex(eventId);
  return index.map(metaToUpload);
}

export async function addPhotoToCloud(upload: Upload): Promise<StoredPhotoMeta | null> {
  if (!hasBlob()) return null;

  const id = normalizeEventId(upload.eventId);
  if (!id || !upload.imageData) return null;

  if (upload.imageData.startsWith("http")) {
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
      imageUrl: upload.imageData,
    };
    const index = await readPhotosIndex(id);
    const next = [meta, ...index.filter((p) => p.id !== upload.id)];
    const ok = await writePhotosIndex(id, next);
    return ok ? meta : null;
  }

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
    imageUrl: blob.url,
  };

  const index = await readPhotosIndex(id);
  const next = [meta, ...index.filter((p) => p.id !== upload.id)];
  const ok = await writePhotosIndex(id, next);
  return ok ? meta : null;
}

export async function updatePhotoInCloud(
  eventId: string,
  photoId: string,
  patch: Partial<Pick<Upload, "status" | "caption" | "segment" | "filter" | "isExtra" | "slotLocked">>
): Promise<boolean> {
  const id = normalizeEventId(eventId);
  if (!id) return false;

  const index = await readPhotosIndex(id);
  const idx = index.findIndex((p) => p.id === photoId);
  if (idx < 0) return false;

  index[idx] = { ...index[idx], ...patch };
  return writePhotosIndex(id, index);
}

export async function replacePhotoInCloud(
  eventId: string,
  photoId: string,
  upload: Upload
): Promise<StoredPhotoMeta | null> {
  await updatePhotoInCloud(eventId, photoId, { status: "removed" });
  return addPhotoToCloud({ ...upload, id: photoId, eventId: normalizeEventId(eventId) });
}
