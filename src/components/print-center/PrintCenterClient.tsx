"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { PrintCenterStatsBar } from "@/components/print-center/PrintCenterStatsBar";
import { PrintCenterFilters } from "@/components/print-center/PrintCenterFilters";
import { PhotoMasonryGrid } from "@/components/print-center/PhotoMasonryGrid";
import { PhotoPreviewModal } from "@/components/print-center/PhotoPreviewModal";
import { PrintInstructionsModal } from "@/components/print-center/PrintInstructionsModal";
import { PrintHistorySection } from "@/components/print-center/PrintHistorySection";
import { Button } from "@/components/ui/Button";
import { getEvents, getUploads } from "@/lib/store";
import {
  deletePhoto,
  downloadPhoto,
  fetchPrintCenterPhotos,
  mergeLocalPhotos,
  printPhoto,
  togglePhotoFavorite,
  uploadToPrintCenterPhoto,
} from "@/lib/photoActions";
import { fetchPrintHistory, fetchPrintStats, markPrinted } from "@/lib/printQueue";
import type {
  EventCategoryFilter,
  PrintCenterPhoto,
  PrintCenterStats,
  PrintCenterViewFilter,
  PrintHistoryFilter,
  PrintHistoryItem,
} from "@/types/print-center";
import type { PrintQueueItem } from "@/types/print-center";

export function PrintCenterClient() {
  const eventIds = useMemo(
    () => getEvents().filter((e) => e.status !== "archived").map((e) => e.id),
    []
  );

  const [photos, setPhotos] = useState<PrintCenterPhoto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [eventCategory, setEventCategory] = useState<EventCategoryFilter>("all");
  const [viewFilter, setViewFilter] = useState<PrintCenterViewFilter>("all");
  const [selected, setSelected] = useState<PrintCenterPhoto | null>(null);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<PrintCenterStats>({
    photosUploadedToday: 0,
    photosPrintedToday: 0,
    favoriteCount: 0,
    pendingQueueCount: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [history, setHistory] = useState<PrintHistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState<PrintHistoryFilter>("today");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [printModal, setPrintModal] = useState<{
    open: boolean;
    imageUrl: string;
    queueItem: PrintQueueItem | null;
  }>({ open: false, imageUrl: "", queueItem: null });
  const [marking, setMarking] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const buildLocalPhotos = useCallback((): PrintCenterPhoto[] => {
    const events = getEvents();
    const local: PrintCenterPhoto[] = [];
    for (const event of events) {
      if (event.status === "archived") continue;
      const uploads = getUploads(event.id, true).filter(
        (u) => !u.isVideo && u.status !== "removed"
      );
      const category =
        (event.settings as { eventType?: string }).eventType ?? "wedding";
      for (const u of uploads) {
        local.push(
          uploadToPrintCenterPhoto(u, event.coupleName, category)
        );
      }
    }
    return local;
  }, []);

  const loadPhotos = useCallback(
    async (reset: boolean, pageCursor?: string | null) => {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await fetchPrintCenterPhotos({
          cursor: reset ? undefined : pageCursor ?? undefined,
          limit: 24,
          eventCategory: eventCategory === "all" ? undefined : eventCategory,
          eventIds,
          favoritesOnly: viewFilter === "favorites",
        });

        const local = buildLocalPhotos();
        let merged = mergeLocalPhotos(res.photos, local);

        if (eventCategory !== "all") {
          merged = merged.filter((p) => p.eventCategory === eventCategory);
        }
        if (viewFilter === "favorites") {
          merged = merged.filter((p) => p.isFavorite);
        }

        merged.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setPhotos((prev) => {
          if (reset) return merged;
          return mergeLocalPhotos([...prev, ...res.photos], local);
        });
        setCursor(res.nextCursor);
        setHasMore(res.hasMore);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildLocalPhotos, eventCategory, eventIds, viewFilter]
  );

  const refreshStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await fetchPrintStats(eventIds);
      setStats(s);
    } finally {
      setStatsLoading(false);
    }
  }, [eventIds]);

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const items = await fetchPrintHistory(historyFilter);
      setHistory(items);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyFilter]);

  useEffect(() => {
    setCursor(null);
    void loadPhotos(true);
    void refreshStats();
  }, [eventCategory, viewFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void refreshHistory();
  }, [historyFilter, refreshHistory]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore && hasMore) {
          void loadPhotos(false, cursor);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, cursor, loadPhotos]);

  const handlePrint = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const { queueItem } = await printPhoto(selected);
      setPrintModal({
        open: true,
        imageUrl: selected.imageUrl,
        queueItem,
      });
      void refreshStats();
    } finally {
      setBusy(false);
    }
  };

  const handleMarkPrinted = async () => {
    if (!printModal.queueItem) {
      setPrintModal((m) => ({ ...m, open: false }));
      return;
    }
    setMarking(true);
    try {
      await markPrinted(printModal.queueItem.id);
      setPrintModal((m) => ({ ...m, open: false }));
      void refreshStats();
      void refreshHistory();
    } finally {
      setMarking(false);
    }
  };

  const handleFavorite = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const favorited = await togglePhotoFavorite(selected.id);
      const updated = { ...selected, isFavorite: favorited };
      setSelected(updated);
      setPhotos((prev) =>
        prev.map((p) => (p.id === selected.id ? { ...p, isFavorite: favorited } : p))
      );
      void refreshStats();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm("Remove this photo from the event gallery?")) return;
    setBusy(true);
    try {
      await deletePhoto(selected);
      setPhotos((prev) => prev.filter((p) => p.id !== selected.id));
      setSelected(null);
      void refreshStats();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen-safe luxury-page-bg safe-x pb-12">
      <header className="sticky top-0 z-30 luxury-glass border-b border-blush/60 safe-top">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="p-2 rounded-full hover:bg-blush/60 touch-target flex-shrink-0"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-charcoal" />
            </Link>
            <div className="min-w-0">
              <h1 className="font-serif text-xl md:text-2xl text-charcoal truncate">
                Instant Print Center
              </h1>
              <p className="text-xs text-warm-gray hidden sm:block">
                Prillaga &amp; Co. · Xiaomi Portable Photo Printer
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void loadPhotos(true);
              void refreshStats();
              void refreshHistory();
            }}
            className="flex-shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-8">
        <PrintCenterStatsBar stats={stats} loading={statsLoading} />

        <section className="space-y-4">
          <div>
            <h2 className="font-serif text-xl text-charcoal">Upload Feed</h2>
            <p className="text-sm text-warm-gray mt-1">
              Guest photos from QR uploads — newest first
            </p>
          </div>
          <PrintCenterFilters
            eventCategory={eventCategory}
            viewFilter={viewFilter}
            onEventCategory={(c) => {
              setEventCategory(c);
              setViewFilter("all");
            }}
            onViewFilter={setViewFilter}
          />
          <PhotoMasonryGrid
            photos={photos}
            onSelect={setSelected}
            loading={loading}
          />
          {loadingMore && (
            <p className="text-center text-sm text-warm-gray py-4">Loading more…</p>
          )}
          <div ref={sentinelRef} className="h-4" aria-hidden />
        </section>

        <PrintHistorySection
          items={history}
          filter={historyFilter}
          onFilterChange={setHistoryFilter}
          loading={historyLoading}
        />
      </main>

      <PhotoPreviewModal
        photo={selected}
        onClose={() => setSelected(null)}
        onPrint={handlePrint}
        onDownload={() => selected && downloadPhoto(selected)}
        onFavorite={handleFavorite}
        onDelete={handleDelete}
        busy={busy}
      />

      <PrintInstructionsModal
        open={printModal.open}
        imageUrl={printModal.imageUrl}
        onOpenImage={() => window.open(printModal.imageUrl, "_blank")}
        onMarkPrinted={handleMarkPrinted}
        onClose={() => setPrintModal((m) => ({ ...m, open: false }))}
        marking={marking}
      />
    </div>
  );
}
