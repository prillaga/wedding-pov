"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EventQRCode } from "@/components/qr/EventQRCode";
import { getEventJoinUrl, getEventShortCode, getEventStatusLabel } from "@/lib/event-utils";
import {
  archiveEvent,
  getEventStats,
  getManageableEvents,
  getUploads,
} from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { Archive, Download, Edit, QrCode, Users } from "lucide-react";

export function MyEventsPanel() {
  const router = useRouter();
  const [qrModal, setQrModal] = useState<{ eventId: string; autoDownload?: boolean } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const events = useMemo(() => getManageableEvents(), [refreshKey]);

  const activeEvents = events.filter((e) => e.status !== "archived");

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
          {activeEvents.map((event) => {
            const stats = getEventStats(event.id);
            const photos = getUploads(event.id).filter((u) => u.status !== "removed");
            const displayLink = getEventJoinUrl(event.id).replace(/^https?:\/\//, "");
            const shortCode = getEventShortCode(event.settings);

            return (
              <div
                key={event.id}
                className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-3"
              >
                <div>
                  <p className="font-serif text-lg font-semibold">{event.coupleName}</p>
                  <p className="text-sm text-warm-gray">{formatDate(event.weddingDate)}</p>
                  <p className="text-xs text-champagne mt-1">
                    Status: {getEventStatusLabel(event.status)}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-warm-gray">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {stats.totalGuests} guests
                    </span>
                    <span>{photos.length} photos</span>
                  </div>
                  <p className="text-[10px] font-mono text-warm-gray mt-2">
                    ID: {event.id} · Code: {shortCode}
                  </p>
                  <p className="text-[10px] font-mono text-warm-gray truncate">{displayLink}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setQrModal({ eventId: event.id })}
                  >
                    <QrCode className="w-4 h-4" /> View QR
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQrModal({ eventId: event.id, autoDownload: true })}
                  >
                    <Download className="w-4 h-4" /> Download QR
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/${event.id}`)}
                  >
                    <Edit className="w-4 h-4" /> Edit Event
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      archiveEvent(event.id);
                      setRefreshKey((k) => k + 1);
                    }}
                  >
                    <Archive className="w-4 h-4" /> Archive Event
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
