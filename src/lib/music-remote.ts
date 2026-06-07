import { ADMIN_AUTH_KEY, ADMIN_PASSWORD } from "@/lib/constants";

function getAdminPasswordHeader(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    sessionStorage.getItem(ADMIN_AUTH_KEY);
    return ADMIN_PASSWORD;
  } catch {
    return ADMIN_PASSWORD;
  }
}

export async function uploadSlideshowMusicRemote(
  eventId: string,
  file: File
): Promise<{ ok: true; trackUrl: string; trackName: string } | { ok: false; error: string }> {
  const form = new FormData();
  form.append("music", file);

  try {
    const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/music`, {
      method: "POST",
      headers: {
        "x-admin-password": getAdminPasswordHeader() ?? ADMIN_PASSWORD,
      },
      body: form,
    });

    const data = (await res.json().catch(() => ({}))) as {
      trackUrl?: string;
      trackName?: string;
      error?: string;
    };

    if (!res.ok || !data.trackUrl) {
      return { ok: false, error: data.error ?? `Upload failed (${res.status})` };
    }

    return {
      ok: true,
      trackUrl: data.trackUrl,
      trackName: data.trackName ?? file.name.replace(/\.[^.]+$/, ""),
    };
  } catch {
    return { ok: false, error: "Network error — could not upload music" };
  }
}
