import { PRODUCTION_APP_URL } from "./constants";

function isLocalOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.endsWith(".local")
    );
  } catch {
    return true;
  }
}

/** Canonical app origin for share links and QR codes (never localhost). */
export function getAppOrigin(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (!isLocalOrigin(origin)) return origin;
  }

  return PRODUCTION_APP_URL;
}

/** Guest invitation URL — always absolute HTTPS for reliable QR scanning. */
export function getEventJoinUrl(eventId: string, bootstrap?: string): string {
  const id = decodeURIComponent(eventId).trim();
  const base = `${getAppOrigin()}/wedding/${encodeURIComponent(id)}`;
  if (!bootstrap) return base;
  return `${base}?cfg=${encodeURIComponent(bootstrap)}`;
}
