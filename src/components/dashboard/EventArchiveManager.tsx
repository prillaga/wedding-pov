"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  downloadEventSummaryHtml,
  downloadFullEventBackup,
  downloadGuestListCsv,
  downloadPhotosByGuest,
  downloadPhotosBySegment,
  downloadPhotosZip,
  getGuestNamesFromUploads,
} from "@/lib/event-archive";
import { SEGMENT_DOWNLOAD_OPTIONS } from "@/lib/constants";
import {
  archiveEvent,
  clearEventGuestData,
  createNewWeddingEvent,
  deleteEventPermanently,
  getArchivedEvents,
  getGuests,
  getStorageDashboard,
  getUploads,
  resetEventForNewWedding,
  restoreEvent,
} from "@/lib/store";
import { formatDate, formatGuestNamePOV } from "@/lib/utils";
import type { EventStats, WeddingEvent } from "@/types";
import {
  AlertTriangle,
  Archive,
  Download,
  FileText,
  FolderArchive,
  HardDrive,
  RefreshCw,
  RotateCcw,
  Trash2,
} from "lucide-react";

interface EventArchiveManagerProps {
  eventId: string;
  event: WeddingEvent;
  stats: EventStats;
  onRefresh: () => void;
}

export function EventArchiveManager({
  eventId,
  event,
  stats,
  onRefresh,
}: EventArchiveManagerProps) {
  const router = useRouter();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newBride, setNewBride] = useState(event.settings.brideName);
  const [newGroom, setNewGroom] = useState(event.settings.groomName);
  const [newDate, setNewDate] = useState(event.settings.weddingDate);
  const [newVenue, setNewVenue] = useState(event.settings.venue);

  const storage = getStorageDashboard();
  const photos = useMemo(
    () => getUploads(eventId).filter((u) => u.status !== "removed"),
    [eventId, stats.totalUploads]
  );
  const allPhotos = photos;
  const guests = useMemo(() => getGuests(eventId), [eventId, stats.totalGuests]);
  const guestNames = useMemo(() => getGuestNamesFromUploads(allPhotos), [allPhotos]);
  const archivedEvents = getArchivedEvents().filter((e) => e.id !== eventId);
  const isArchived = event.status === "archived";

  const eventLabel = sanitize(event.coupleName);

  const runDownload = async (key: string, fn: () => Promise<void> | void) => {
    setDownloading(key);
    try {
      await fn();
    } finally {
      setDownloading(null);
    }
  };

  const handleArchive = () => {
    archiveEvent(eventId);
    onRefresh();
  };

  const handleRestore = () => {
    restoreEvent(eventId);
    onRefresh();
  };

  const handleResetSameEvent = () => {
    resetEventForNewWedding(eventId, {
      brideName: newBride,
      groomName: newGroom,
      weddingDate: newDate,
      venue: newVenue,
    });
    setShowResetModal(false);
    onRefresh();
  };

  const handleCreateNewWedding = () => {
    const created = createNewWeddingEvent(eventId, {
      brideName: newBride,
      groomName: newGroom,
      weddingDate: newDate,
      venue: newVenue,
    });
    setShowResetModal(false);
    if (created) router.push(`/dashboard/${created.id}`);
    onRefresh();
  };

  const handleDelete = () => {
    if (deleteEventPermanently(eventId)) {
      router.push("/");
    } else {
      clearEventGuestData(eventId);
      setShowDeleteModal(false);
      onRefresh();
    }
  };

  const storagePct = Math.min(
    100,
    (storage.storageUsedGB / storage.storageLimitGB) * 100
  );

  return (
    <div className="space-y-6">
      {/* Storage Dashboard */}
      <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-4">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-champagne" />
          <h3 className="font-medium">Storage Dashboard</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-blush/30">
            <p className="text-xs text-warm-gray">Storage Used</p>
            <p className="text-lg font-serif font-semibold">
              {storage.storageUsedGB} GB / {storage.storageLimitGB} GB
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blush/30">
            <p className="text-xs text-warm-gray">Photos</p>
            <p className="text-lg font-serif font-semibold">{storage.totalPhotos.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-blush/30">
            <p className="text-xs text-warm-gray">Active Events</p>
            <p className="text-lg font-serif font-semibold">{storage.activeEvents}</p>
          </div>
          <div className="p-3 rounded-xl bg-blush/30">
            <p className="text-xs text-warm-gray">Archived Weddings</p>
            <p className="text-lg font-serif font-semibold">{storage.archivedEvents}</p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-blush overflow-hidden">
          <div
            className="h-full rounded-full bg-champagne transition-all"
            style={{ width: `${storagePct}%` }}
          />
        </div>
        <p className="text-xs text-warm-gray">
          This event: {stats.totalUploads} photos ·{" "}
          {stats.storageUsedMB >= 1024
            ? `${(stats.storageUsedMB / 1024).toFixed(1)} GB`
            : `${stats.storageUsedMB.toFixed(1)} MB`}
        </p>
      </section>

      {/* Event status */}
      {isArchived && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <Archive className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Archived Event</p>
            <p className="text-sm text-amber-800 mt-1">
              {event.coupleName} · {formatDate(event.weddingDate)}
              {event.archivedAt && (
                <> · Archived {new Date(event.archivedAt).toLocaleDateString()}</>
              )}
            </p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={handleRestore}>
              <RotateCcw className="w-4 h-4" /> Restore Event
            </Button>
          </div>
        </div>
      )}

      {/* Download All Photos */}
      <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-3">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-champagne" />
          <h3 className="font-medium">Download All Photos</h3>
        </div>
        <p className="text-xs text-warm-gray">
          Original quality photos exported from guest uploads. Perfect before clearing or reusing
          this event.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="gold"
            size="sm"
            loading={downloading === "all"}
            disabled={photos.length === 0}
            onClick={() =>
              runDownload("all", () =>
                downloadPhotosZip(photos, `${eventLabel}-all-photos.zip`, "All wedding photos")
              )
            }
          >
            Download All Photos (.zip)
          </Button>
          <Button
            variant="secondary"
            size="sm"
            loading={downloading === "backup"}
            disabled={photos.length === 0}
            onClick={() => runDownload("backup", () => downloadFullEventBackup(event, guests, photos))}
          >
            <FolderArchive className="w-4 h-4" /> Full Event Backup (.zip)
          </Button>
        </div>

        {guestNames.length > 0 && (
          <>
            <p className="text-xs font-medium text-warm-gray pt-2">Download Gallery by Guest</p>
            <div className="flex flex-wrap gap-2">
              {guestNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  disabled={downloading !== null}
                  onClick={() =>
                    runDownload(`guest-${name}`, () =>
                      downloadPhotosByGuest(photos, name, eventLabel)
                    )
                  }
                  className="px-3 py-1.5 rounded-full text-xs border border-champagne/20 hover:bg-blush transition-colors"
                >
                  {formatGuestNamePOV(name)}
                </button>
              ))}
            </div>
          </>
        )}

        <p className="text-xs font-medium text-warm-gray pt-2">Download by Event Section</p>
        <div className="flex flex-wrap gap-2">
          {SEGMENT_DOWNLOAD_OPTIONS.map(({ segment, label }) => (
            <button
              key={segment}
              type="button"
              disabled={downloading !== null || !photos.some((p) => p.segment === segment)}
              onClick={() =>
                runDownload(`seg-${segment}`, () =>
                  downloadPhotosBySegment(photos, segment, eventLabel)
                )
              }
              className="px-3 py-1.5 rounded-full text-xs border border-champagne/20 hover:bg-blush transition-colors disabled:opacity-40"
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Event Backup formats */}
      <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-champagne" />
          <h3 className="font-medium">Event Backup</h3>
        </div>
        <p className="text-xs text-warm-gray">
          Complete archive: photos, guest list, event settings, theme, and slideshow configuration.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <Button
            variant="secondary"
            size="sm"
            loading={downloading === "backup"}
            onClick={() => runDownload("backup", () => downloadFullEventBackup(event, guests, photos))}
          >
            ZIP Archive
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadEventSummaryHtml(event, guests, photos)}
          >
            PDF Summary (HTML)
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadGuestListCsv(event, guests, photos)}
          >
            CSV Guest List
          </Button>
        </div>
      </section>

      {/* Archive & Reset */}
      {!isArchived && (
        <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-3">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-champagne" />
            <h3 className="font-medium">Archive & Reset</h3>
          </div>
          <p className="text-xs text-warm-gray">
            Archive hides this wedding from the active dashboard while keeping all data downloadable.
            Reset prepares the platform for your next wedding.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={handleArchive}>
              <Archive className="w-4 h-4" /> Archive Event
            </Button>
            <Button variant="gold" size="sm" onClick={() => setShowResetModal(true)}>
              <RefreshCw className="w-4 h-4" /> Create New Wedding
            </Button>
            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setShowDeleteModal(true)}>
              <Trash2 className="w-4 h-4" /> Delete Event
            </Button>
          </div>
        </section>
      )}

      {/* Other archived events */}
      {archivedEvents.length > 0 && (
        <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-3">
          <h3 className="font-medium">Archived Weddings</h3>
          {archivedEvents.map((archived) => (
            <div
              key={archived.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-blush/20 border border-champagne/10"
            >
              <div>
                <p className="font-medium">{archived.coupleName}</p>
                <p className="text-xs text-warm-gray">
                  {formatDate(archived.weddingDate)} · Status: Archived
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    restoreEvent(archived.id);
                    onRefresh();
                  }}
                >
                  Restore
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/dashboard/${archived.id}`)}
                >
                  Open
                </Button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <Modal onClose={() => setShowDeleteModal(false)}>
          <div className="flex items-center gap-2 text-red-600 mb-3">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-serif text-lg font-semibold">Warning</h3>
          </div>
          <p className="text-sm text-warm-gray leading-relaxed mb-4">
            This action will permanently remove all wedding photos and event data for{" "}
            <strong>{event.coupleName}</strong>.
          </p>
          <p className="text-sm font-medium mb-4">Have you downloaded a backup?</p>
          <div className="space-y-2">
            <Button
              variant="gold"
              className="w-full"
              loading={downloading === "backup"}
              onClick={() =>
                runDownload("backup", () => downloadFullEventBackup(event, guests, photos))
              }
            >
              Download Backup First
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="ghost" className="w-full text-red-500" onClick={handleDelete}>
              Delete Event
            </Button>
          </div>
        </Modal>
      )}

      {/* Create new wedding modal */}
      {showResetModal && (
        <Modal onClose={() => setShowResetModal(false)}>
          <h3 className="font-serif text-lg font-semibold mb-2">Create New Wedding</h3>
          <p className="text-sm text-warm-gray mb-4">
            Download a backup first, then reset for the next event. Clears gallery, guest uploads,
            and counters. Generates a new event link & QR code.
          </p>
          <div className="space-y-3 mb-4">
            <Input label="Bride Name" value={newBride} onChange={(e) => setNewBride(e.target.value)} />
            <Input label="Groom Name" value={newGroom} onChange={(e) => setNewGroom(e.target.value)} />
            <Input
              label="Wedding Date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
            <Input label="Venue" value={newVenue} onChange={(e) => setNewVenue(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Button
              variant="secondary"
              className="w-full"
              loading={downloading === "backup"}
              onClick={() =>
                runDownload("backup", () => downloadFullEventBackup(event, guests, photos))
              }
            >
              Download Backup First
            </Button>
            <Button variant="gold" className="w-full" onClick={handleCreateNewWedding}>
              Create New Wedding (New QR / Link)
            </Button>
            <Button variant="secondary" className="w-full" onClick={handleResetSameEvent}>
              Reset Same Event Link
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setShowResetModal(false)}>
              Cancel
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-warm-gray hover:text-charcoal text-xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

function sanitize(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-") || "wedding";
}
