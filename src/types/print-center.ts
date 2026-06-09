import type { EventSegment, UploadStatus } from "./index";

export type EventCategoryFilter =
  | "all"
  | "wedding"
  | "birthday"
  | "graduation"
  | "corporate";

export type PrintQueueStatus = "pending" | "printed" | "cancelled";

export type AiHighlightType =
  | "best_smile"
  | "best_group"
  | "best_couple"
  | "most_popular";

export const AI_HIGHLIGHT_LABELS: Record<AiHighlightType, string> = {
  best_smile: "Best Smile",
  best_group: "Best Group Shot",
  best_couple: "Best Couple Shot",
  most_popular: "Most Popular",
};

/** Unified photo for Print Center feed (Supabase + cloud blob) */
export interface PrintCenterPhoto {
  id: string;
  eventId: string;
  eventName: string;
  eventCategory: EventCategoryFilter | string;
  guestId: string;
  guestName: string;
  imageUrl: string;
  caption?: string;
  segment: EventSegment;
  status: UploadStatus;
  isVideo: boolean;
  createdAt: string;
  aiScore?: number | null;
  aiHighlightType?: AiHighlightType | null;
  isFavorite?: boolean;
  printStatus?: PrintQueueStatus | null;
}

export interface PrintQueueItem {
  id: string;
  photoId: string;
  eventId: string;
  status: PrintQueueStatus;
  printedBy?: string | null;
  printedAt?: string | null;
  createdAt: string;
  photo?: PrintCenterPhoto;
}

export interface PrintHistoryItem extends PrintQueueItem {
  photo: PrintCenterPhoto;
}

export interface FavoriteRecord {
  id: string;
  photoId: string;
  userId: string;
  createdAt: string;
}

export interface PrintCenterStats {
  photosUploadedToday: number;
  photosPrintedToday: number;
  favoriteCount: number;
  pendingQueueCount: number;
}

export type PrintHistoryFilter = "today" | "week" | "all";

export type PrintCenterViewFilter = "all" | "favorites" | "pending";

export interface PrintCenterPhotosQuery {
  cursor?: string;
  limit?: number;
  eventCategory?: EventCategoryFilter;
  eventIds?: string[];
  favoritesOnly?: boolean;
}

export interface PrintCenterPhotosResponse {
  photos: PrintCenterPhoto[];
  nextCursor: string | null;
  hasMore: boolean;
}
