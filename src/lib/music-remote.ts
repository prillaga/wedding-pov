import { ADMIN_AUTH_KEY, ADMIN_PASSWORD } from "@/lib/constants";
import { normalizeEventId } from "@/lib/demo-event";
import { fetchCloudStorageStatus } from "@/lib/event-remote";
import { upload } from "@vercel/blob/client";

function getAdminPasswordHeader(): string {
  if (typeof window === "undefined") return ADMIN_PASSWORD;
  try {
    sessionStorage.getItem(ADMIN_AUTH_KEY);
    return ADMIN_PASSWORD;
  } catch {
    return ADMIN_PASSWORD;
  }
}

function musicPathname(eventId: string, filename: string): string {
  const id = normalizeEventId(eventId);
  const ext = filename.match(/\.([^.]+)$/)?.[1]?.toLowerCase() || "mp3";
  return `wedding-pov/events/${id}/slideshow-music.${ext}`;
}

function formatUploadError(err: unknown, status?: number): string {
  if (status === 413) {
    return "File is too large. Try a shorter clip or lower quality MP3 (under 50 MB).";
  }
  if (err instanceof Error && err.message) {
    if (err.message.includes("413")) {
      return "File is too large. Try a shorter clip or lower quality MP3 (under 50 MB).";
    }
    return err.message;
  }
  return "Upload failed. Try a smaller MP3 or check your connection.";
}

/** Upload directly to Vercel Blob (bypasses 4.5 MB server limit). */
export async function uploadSlideshowMusicRemote(
  eventId: string,
  file: File
): Promise<{ ok: true; trackUrl: string; trackName: string } | { ok: false; error: string }> {
  const id = normalizeEventId(eventId);
  if (!id) return { ok: false, error: "Invalid event id" };

  if (!file.type.startsWith("audio/") && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
    return { ok: false, error: "Please choose an audio file (MP3, M4A, WAV)" };
  }

  const cloud = await fetchCloudStorageStatus();
  if (!cloud.cloudConfigured) {
    return {
      ok: false,
      error: "Cloud storage not connected. Connect Vercel Blob in your project settings.",
    };
  }

  const pathname = musicPathname(id, file.name);
  const trackName = file.name.replace(/\.[^.]+$/, "");

  try {
    const blob = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: `/api/events/${encodeURIComponent(id)}/music/upload`,
      headers: {
        "x-admin-password": getAdminPasswordHeader(),
      },
      multipart: file.size > 4 * 1024 * 1024,
      contentType: file.type || "audio/mpeg",
    });

    return { ok: true, trackUrl: blob.url, trackName };
  } catch (err) {
    return { ok: false, error: formatUploadError(err) };
  }
}

/** @deprecated Server POST hits 413 on Vercel for files over ~4.5 MB */
export async function uploadSlideshowMusicLegacy(
  eventId: string,
  file: File
): Promise<{ ok: true; trackUrl: string; trackName: string } | { ok: false; error: string }> {
  const form = new FormData();
  form.append("music", file);

  try {
    const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/music`, {
      method: "POST",
      headers: { "x-admin-password": getAdminPasswordHeader() },
      body: form,
    });

    const data = (await res.json().catch(() => ({}))) as {
      trackUrl?: string;
      trackName?: string;
      error?: string;
    };

    if (!res.ok || !data.trackUrl) {
      return {
        ok: false,
        error: formatUploadError(data.error, res.status),
      };
    }

    return {
      ok: true,
      trackUrl: data.trackUrl,
      trackName: data.trackName ?? trackNameFromFile(file.name),
    };
  } catch (err) {
    return { ok: false, error: formatUploadError(err) };
  }
}

function trackNameFromFile(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}
