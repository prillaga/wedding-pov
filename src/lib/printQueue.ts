/**
 * Print queue client service.
 * Website → Print Queue → Android Tablet → Xiaomi Photo Printer
 *
 * Structured for future automatic printing from a connected tablet.
 */

import { ADMIN_PASSWORD, ADMIN_AUTH_KEY } from "@/lib/constants";
import type {
  PrintHistoryFilter,
  PrintHistoryItem,
  PrintQueueItem,
  PrintCenterStats,
} from "@/types/print-center";

function adminHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-admin-password": ADMIN_PASSWORD,
  };
  if (typeof window !== "undefined") {
    try {
      if (localStorage.getItem(ADMIN_AUTH_KEY) === "1") {
        headers["x-admin-password"] = ADMIN_PASSWORD;
      }
    } catch {
      /* ignore */
    }
  }
  return headers;
}

export async function enqueuePrint(
  photoId: string,
  eventId: string
): Promise<PrintQueueItem | null> {
  const res = await fetch("/api/print-center/queue", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ photoId, eventId }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { item: PrintQueueItem };
  return data.item;
}

export async function markPrinted(queueId: string): Promise<boolean> {
  const res = await fetch(`/api/print-center/queue/${encodeURIComponent(queueId)}`, {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({ status: "printed" }),
  });
  return res.ok;
}

export async function fetchPrintHistory(
  filter: PrintHistoryFilter = "all"
): Promise<PrintHistoryItem[]> {
  const res = await fetch(
    `/api/print-center/history?filter=${encodeURIComponent(filter)}`,
    { headers: adminHeaders(), cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { items: PrintHistoryItem[] };
  return data.items ?? [];
}

export async function fetchPendingQueue(): Promise<PrintQueueItem[]> {
  const res = await fetch("/api/print-center/queue", {
    headers: adminHeaders(),
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { items: PrintQueueItem[] };
  return data.items ?? [];
}

export async function fetchPrintStats(eventIds: string[]): Promise<PrintCenterStats> {
  const res = await fetch("/api/print-center/stats", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ eventIds }),
  });
  if (!res.ok) {
    return {
      photosUploadedToday: 0,
      photosPrintedToday: 0,
      favoriteCount: 0,
      pendingQueueCount: 0,
    };
  }
  return (await res.json()) as PrintCenterStats;
}

/** Future: poll queue for Android tablet print worker */
export async function pollPendingForDevice(): Promise<PrintQueueItem[]> {
  return fetchPendingQueue();
}
