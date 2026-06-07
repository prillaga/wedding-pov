import { normalizeEventId } from "@/lib/demo-event";
import { put } from "@vercel/blob";

const BLOB_PREFIX = "wedding-pov/events/";

function hasBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function musicPath(eventId: string, ext: string): string {
  return `${BLOB_PREFIX}${normalizeEventId(eventId)}/slideshow-music.${ext}`;
}

function extensionForType(contentType: string, filename?: string): string {
  if (contentType.includes("mpeg") || contentType.includes("mp3")) return "mp3";
  if (contentType.includes("wav")) return "wav";
  if (contentType.includes("ogg")) return "ogg";
  if (contentType.includes("aac") || contentType.includes("mp4")) return "m4a";
  if (filename?.includes(".")) {
    return filename.split(".").pop()?.toLowerCase() ?? "mp3";
  }
  return "mp3";
}

export async function uploadSlideshowMusic(
  eventId: string,
  buffer: Buffer,
  contentType: string,
  filename?: string
): Promise<string | null> {
  if (!hasBlob()) return null;

  const id = normalizeEventId(eventId);
  if (!id) return null;

  const ext = extensionForType(contentType, filename);

  try {
    const blob = await put(musicPath(id, ext), buffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: contentType || "audio/mpeg",
    });
    return blob.url;
  } catch {
    return null;
  }
}
