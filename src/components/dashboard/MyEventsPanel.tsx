"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EventQRCode } from "@/components/qr/EventQRCode";
import { getEventJoinUrl, getEventShortCode, getEventStatusLabel } from "@/lib/event-utils";
import {
  archiveEvent,
  cleanupAllEventsExceptDemo,
  clearDemoGallery,
  deleteEventPermanently,
  getArchivedEvents,
  getEventStats,
  getManageableEvents,
  getUploads,
  restoreEvent,
  seedSampleUploads,
} from "@/lib/store";
import { DEMO_EVENT_ID } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { WeddingEvent } from "@/types";
import { AlertTriangle, Archive, Download, Edit, QrCode, RotateCcw, Trash2, Users } from "lucide-react";

export function MyEventsPanel() {
  const router = useRouter();
  const [qrModal, setQrModal] = useState<{ eventId: string; autoDownload?: boolean } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WeddingEvent | null>(null);
  const [showSampleCleanup, setShowSampleCleanup] = useState(false);
  const [showClearDemoGallery, setShowClearDemoGallery] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const events = useMemo(() => getManageableEvents(), [refreshKey]);
  const archivedEvents = useMemo(() => getArchivedEvents(), [refreshKey]);

  const activeEvents = events.filter((e) => e.status !== "archived");

  const refresh = () => setRefreshKey((k) => k + 1);

  const handlePermanentDelete = () => {
    if (!deleteTarget) return;
    if (deleteEventPermanently(deleteTarget.id)) {
      setDeleteTarget(null);
      refresh();
    }
  };

  const handleKeepSampleOnly = () => {
    const { removed } = cleanupAllEventsExceptDemo();
    setShowSampleCleanup(false);
    refresh();
    if (removed > 0) {
      router.push(`/dashboard/${DEMO_EVENT_ID}`);
    }
  };

  const handleClearDemoGallery = () => {
    clearDemoGallery();
    setShowClearDemoGallery(false);
    refresh();
  };

  const handleRestoreDemoGallery = () => {
    void seedSampleUploads(DEMO_EVENT_ID, true).then(refresh);
  };

  const nonDemoCount = events.filter((e) => e.id !== DEMO_EVENT_ID).length;
  const demoEvent = events.find((e) => e.id === DEMO_EVENT_ID);
  const demoPhotoCount = demoEvent
    ? getUploads(demoEvent.id).filter((u) => u.status !== "removed").length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-semibold">My Events</h2>
          <p className="text-sm text-warm-gray mt-0.5">
            Create once — QR code and guest link are generated automatically.
          </p>
        </div>
        <Link href="/dashboard/create">
          <Button variant="gold" size="sm">
            Create Wedding Event
          </Button>
        </Link>
      </div>

      {nonDemoCount > 0 && (
        <div className="p-4 rounded-2xl bg-blush/40 border border-champagne/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-charcoal">Reset to sample wedding</p>
            <p className="text-xs text-warm-gray mt-0.5">
              Remove all events except JJ2027 ({DEMO_EVENT_ID}) and free storage.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-red-500 shrink-0" onClick={() => setShowSampleCleanup(true)}>
            <Trash2 className="w-4 h-4" /> Keep Sample Only
          </Button>
        </div>
      )}

      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative max-h-[92dvh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setQrModal(null)}
              className="absolute top-3 right-3 text-warm-gray hover:text-charcoal text-xl"
              aria-label="Close"
            >
              ×
            </button>
            {(() => {
              const event = events.find((e) => e.id === qrModal.eventId);
              if (!event) return null;
              return (
                <EventQRCode
                  eventId={event.id}
                  coupleName={event.coupleName}
                  size={220}
                  autoDownload={qrModal.autoDownload}
                />
              );
            })()}
          </div>
        </div>
      )}

      {showClearDemoGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-serif text-lg font-semibold">Clear JJ2027 Gallery?</h3>
            </div>
            <p className="text-sm text-warm-gray leading-relaxed mb-4">
              This removes all <strong>{demoPhotoCount} photo(s)</strong> and guest uploads from the
              JJ2027 sample wedding. Sample photos will not come back until you restore them from
              admin.
            </p>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full" onClick={() => setShowClearDemoGallery(false)}>
                Cancel
              </Button>
              <Button
                variant="ghost"
                className="w-full text-red-500 hover:bg-red-50"
                onClick={handleClearDemoGallery}
              >
                <Trash2 className="w-4 h-4" />
                Clear Gallery
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSampleCleanup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-serif text-lg font-semibold">Keep Sample Only?</h3>
            </div>
            <p className="text-sm text-warm-gray leading-relaxed mb-4">
              This permanently deletes <strong>all {nonDemoCount} non-sample event(s)</strong> and
              their photos. Only the <strong>JJ2027</strong> sample wedding (
              {DEMO_EVENT_ID}) will remain.
            </p>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full" onClick={() => setShowSampleCleanup(false)}>
                Cancel
              </Button>
              <Button
                variant="ghost"
                className="w-full text-red-500 hover:bg-red-50"
                onClick={handleKeepSampleOnly}
              >
                <Trash2 className="w-4 h-4" />
                Delete All Except Sample
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-serif text-lg font-semibold">Permanently Delete Event?</h3>
            </div>
            <p className="text-sm text-warm-gray leading-relaxed mb-2">
              This will permanently remove <strong>{deleteTarget.coupleName}</strong>, all guest
              photos, and guest data. This cannot be undone.
            </p>
            <p className="text-sm text-warm-gray mb-4">
              Download a backup from the event&apos;s Archive tab before deleting if you want to
              keep the photos.
            </p>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="ghost"
                className="w-full text-red-500 hover:bg-red-50"
                onClick={handlePermanentDelete}
              >
                <Trash2 className="w-4 h-4" />
                Permanently Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeEvents.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white wedding-shadow border border-champagne/10 text-center">
          <QrCode className="w-10 h-10 text-champagne mx-auto mb-3" />
          <p className="font-medium">No active weddings yet</p>
          <p className="text-sm text-warm-gray mt-1 mb-4">
            Create your first event to generate a QR code for guests.
          </p>
          <Link href="/dashboard/create">
            <Button variant="gold">Create Wedding Event</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {activeEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onViewQr={() => setQrModal({ eventId: event.id })}
              onDownloadQr={() => setQrModal({ eventId: event.id, autoDownload: true })}
              onEdit={() => router.push(`/dashboard/${event.id}`)}
              onArchive={() => {
                archiveEvent(event.id);
                refresh();
              }}
              onDelete={() => setDeleteTarget(event)}
              onClearGallery={
                event.id === DEMO_EVENT_ID ? () => setShowClearDemoGallery(true) : undefined
              }
              onRestoreGallery={
                event.id === DEMO_EVENT_ID ? handleRestoreDemoGallery : undefined
              }
            />
          ))}
        </div>
      )}

      {archivedEvents.length > 0 && (
        <section className="space-y-3">
          <div>
            <h3 className="font-serif text-lg font-semibold">Archived Weddings</h3>
            <p className="text-sm text-warm-gray mt-0.5">
              Hidden from guests · Photos still stored · Permanently delete to free space
            </p>
          </div>
          {archivedEvents.map((event) => (
            <div
              key={event.id}
              className="p-4 rounded-2xl bg-amber-50/50 wedding-shadow border border-amber-200/60 space-y-3"
            >
              <EventCardContent event={event} archived />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    restoreEvent(event.id);
                    refresh();
                  }}
                >
                  <RotateCcw className="w-4 h-4" /> Restore
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/dashboard/${event.id}`)}
                >
                  <Download className="w-4 h-4" /> Download Backup
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={() => setDeleteTarget(event)}
                >
                  <Trash2 className="w-4 h-4" /> Permanently Delete
                </Button>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function EventCardContent({ event, archived }: { event: WeddingEvent; archived?: boolean }) {
  const stats = getEventStats(event.id);
  const photos = getUploads(event.id).filter((u) => u.status !== "removed");
  const displayLink = getEventJoinUrl(event.id).replace(/^https?:\/\//, "");
  const shortCode = getEventShortCode(event.settings);

  return (
    <div>
      <p className="font-serif text-lg font-semibold">{event.coupleName}</p>
      <p className="text-sm text-warm-gray">{formatDate(event.weddingDate)}</p>
      <p className={`text-xs mt-1 ${archived ? "text-amber-700" : "text-champagne"}`}>
        Status: {getEventStatusLabel(event.status)}
        {event.archivedAt && (
          <> · Archived {new Date(event.archivedAt).toLocaleDateString()}</>
        )}
      </p>
      <div className="flex flex-wrap gap-4 mt-2 text-xs text-warm-gray">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" /> {stats.totalGuests} guests
        </span>
        <span>{photos.length} photos</span>
        <span>
          {stats.storageUsedMB >= 1024
            ? `${(stats.storageUsedMB / 1024).toFixed(1)} GB`
            : `${stats.storageUsedMB.toFixed(1)} MB`}{" "}
          storage
        </span>
      </div>
      {!archived && (
        <>
          <p className="text-[10px] font-mono text-warm-gray mt-2">
            ID: {event.id} · Code: {shortCode}
          </p>
          <p className="text-[10px] font-mono text-warm-gray truncate">{displayLink}</p>
        </>
      )}
    </div>
  );
}

function EventCard({
  event,
  onViewQr,
  onDownloadQr,
  onEdit,
  onArchive,
  onDelete,
  onClearGallery,
  onRestoreGallery,
}: {
  event: WeddingEvent;
  onViewQr: () => void;
  onDownloadQr: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onClearGallery?: () => void;
  onRestoreGallery?: () => void;
}) {
  const isDemo = event.id === DEMO_EVENT_ID;

  return (
    <div className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-3">
      <EventCardContent event={event} />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={onViewQr}>
          <QrCode className="w-4 h-4" /> View QR
        </Button>
        <Button variant="ghost" size="sm" onClick={onDownloadQr}>
          <Download className="w-4 h-4" /> Download QR
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="w-4 h-4" /> Edit Event
        </Button>
        {!isDemo && (
          <Button variant="ghost" size="sm" onClick={onArchive}>
            <Archive className="w-4 h-4" /> Archive Event
          </Button>
        )}
        {onClearGallery && (
          <Button variant="ghost" size="sm" className="text-red-500" onClick={onClearGallery}>
            <Trash2 className="w-4 h-4" /> Clear Gallery
          </Button>
        )}
        {onRestoreGallery && (
          <Button variant="ghost" size="sm" onClick={onRestoreGallery}>
            <RotateCcw className="w-4 h-4" /> Restore Sample Photos
          </Button>
        )}
        {!isDemo && (
          <Button variant="ghost" size="sm" className="text-red-500" onClick={onDelete}>
            <Trash2 className="w-4 h-4" /> Permanently Delete
          </Button>
        )}
      </div>
    </div>
  );
}
