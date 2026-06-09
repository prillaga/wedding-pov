"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EventQRCode } from "@/components/qr/EventQRCode";
import { getEventStatusLabel } from "@/lib/event-utils";
import {
  activateEvent,
  archiveEvent,
  deleteEventPermanently,
  pauseEvent,
  updateModeration,
} from "@/lib/store";
import type { WeddingEvent } from "@/types";
import { AlertTriangle, Archive, Pause, Play, Shield, Trash2 } from "lucide-react";

interface EventStatusPanelProps {
  event: WeddingEvent;
  onRefresh: () => void;
}

export function EventStatusPanel({ event, onRefresh }: EventStatusPanelProps) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const status = event.status ?? "active";

  return (
    <div className="space-y-4">
      <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-3">
        <h3 className="font-medium">Event Status</h3>
        <p className="text-sm text-warm-gray">
          Current status:{" "}
          <span className="font-medium text-charcoal">{getEventStatusLabel(status)}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {status !== "active" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                activateEvent(event.id);
                onRefresh();
              }}
            >
              <Play className="w-4 h-4" /> Activate Event
            </Button>
          )}
          {status === "active" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                pauseEvent(event.id);
                onRefresh();
              }}
            >
              <Pause className="w-4 h-4" /> Pause Event
            </Button>
          )}
          {status !== "archived" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                archiveEvent(event.id);
                onRefresh();
              }}
            >
              <Archive className="w-4 h-4" /> Archive Event
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setShowDelete(true)}>
            <Trash2 className="w-4 h-4" /> Permanently Delete
          </Button>
        </div>

        <label className="flex items-center gap-2 text-sm pt-2 border-t border-champagne/10">
          <input
            type="checkbox"
            checked={event.moderation.uploadsDisabled}
            onChange={(e) => {
              updateModeration(event.id, { uploadsDisabled: e.target.checked });
              onRefresh();
            }}
          />
          <Shield className="w-4 h-4 text-champagne" />
          Disable guest uploads
        </label>
      </section>

      <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10">
        <h3 className="font-medium mb-4 text-center">Guest QR Code</h3>
        <EventQRCode eventId={event.id} coupleName={event.coupleName} size={180} />
      </section>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-serif text-lg font-semibold">Permanently Delete Event?</h3>
            </div>
            <p className="text-sm text-warm-gray mb-4">
              This permanently removes all photos and data for {event.coupleName}. Download a backup
              from the Archive tab first. This cannot be undone.
            </p>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full" onClick={() => setShowDelete(false)}>
                Cancel
              </Button>
              <Button
                variant="ghost"
                className="w-full text-red-500"
                onClick={() => {
                  if (deleteEventPermanently(event.id)) {
                    router.push("/dashboard");
                  } else {
                    setShowDelete(false);
                    onRefresh();
                  }
                }}
              >
                Permanently Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
