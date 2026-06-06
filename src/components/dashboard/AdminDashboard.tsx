"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { HighlightsReel } from "@/components/highlights/HighlightsReel";
import {
  approveAllPending,
  deleteUpload,
  getApprovedUploads,
  getEvent,
  getEventStats,
  getUploads,
  updateEventSettings,
  updateModeration,
  updateUploadStatus,
} from "@/lib/store";
import { formatGuestNamePOV } from "@/lib/utils";
import { getEventStatusLabel } from "@/lib/event-utils";
import { pushRemoteEvent } from "@/lib/event-remote";
import type { Upload } from "@/types";
import {
  BarChart3,
  Bookmark,
  Check,
  Film,
  FolderArchive,
  ImageIcon,
  Palette,
  QrCode,
  Settings,
  Shield,
  Sliders,
  Trash2,
  Users,
} from "lucide-react";
import { AdminAnalyticsPanel } from "./AdminAnalyticsPanel";
import { EventArchiveManager } from "./EventArchiveManager";
import { GuestManagementPanel } from "./GuestManagementPanel";
import { EventStatusPanel } from "./EventStatusPanel";
import { HeroBannerEditor } from "./HeroBannerEditor";
import { PhotoLimitManager } from "./PhotoLimitManager";
import { SlideshowSettingsPanel } from "./SlideshowSettingsPanel";
import { TemplateManager } from "./TemplateManager";
import { ThemeManager } from "./ThemeManager";

type AdminTab =
  | "qr"
  | "analytics"
  | "settings"
  | "limits"
  | "hero"
  | "theme"
  | "slideshow"
  | "templates"
  | "moderation"
  | "guests"
  | "archive"
  | "highlights";

interface AdminDashboardProps {
  eventId: string;
}

export function AdminDashboard({ eventId }: AdminDashboardProps) {
  const [tab, setTab] = useState<AdminTab>("qr");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [stats, setStats] = useState(getEventStats(eventId));
  const [event, setEvent] = useState(getEvent(eventId));

  const refresh = () => {
    const current = getEvent(eventId);
    setEvent(current);
    setUploads(getUploads(eventId, true));
    setStats(getEventStats(eventId));
    if (current) void pushRemoteEvent(current);
  };

  useEffect(() => {
    refresh();
  }, [eventId]);

  if (!event) return null;

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "qr", label: "QR Code", icon: <QrCode className="w-4 h-4" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "settings", label: "Event", icon: <Settings className="w-4 h-4" /> },
    { id: "limits", label: "Photo Limits", icon: <Sliders className="w-4 h-4" /> },
    { id: "hero", label: "Hero Banner", icon: <ImageIcon className="w-4 h-4" /> },
    { id: "theme", label: "Theme", icon: <Palette className="w-4 h-4" /> },
    { id: "slideshow", label: "Slideshow", icon: <Film className="w-4 h-4" /> },
    { id: "templates", label: "Templates", icon: <Bookmark className="w-4 h-4" /> },
    { id: "moderation", label: "Moderation", icon: <Shield className="w-4 h-4" /> },
    { id: "guests", label: "Guests", icon: <Users className="w-4 h-4" /> },
    { id: "archive", label: "Archive", icon: <FolderArchive className="w-4 h-4" /> },
    { id: "highlights", label: "AI Reels", icon: <Film className="w-4 h-4" /> },
  ];

  const pending = uploads.filter((u) => u.status === "pending");

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blush to-white border border-champagne/15">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold">{event.coupleName}</h2>
            <p className="text-sm text-warm-gray mt-1">
              Status: {getEventStatusLabel(event.status)} · Manage QR, theme, and guest experience
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs text-champagne hover:underline shrink-0"
          >
            ← All Events
          </Link>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium shrink-0 transition-all ${
              tab === t.id ? "bg-champagne text-white" : "bg-blush text-warm-gray"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "qr" && <EventStatusPanel event={event} onRefresh={refresh} />}

      {tab === "analytics" && (
        <AdminAnalyticsPanel eventId={eventId} event={event} stats={stats} />
      )}

      {tab === "settings" && (
        <div className="space-y-4">
          {[
            { key: "brideName", label: "Bride Name", value: event.settings.brideName },
            { key: "groomName", label: "Groom Name", value: event.settings.groomName },
            { key: "weddingDate", label: "Wedding Date", value: event.settings.weddingDate, type: "date" },
            { key: "venue", label: "Venue", value: event.settings.venue },
            { key: "hashtag", label: "Wedding Hashtag", value: event.settings.hashtag },
          ].map((field) => (
            <Input
              key={field.key}
              label={field.label}
              type={field.type ?? "text"}
              defaultValue={field.value}
              onBlur={(e) => {
                updateEventSettings(eventId, { [field.key]: e.target.value });
                refresh();
              }}
            />
          ))}
          <Textarea
            label="Welcome Message"
            defaultValue={event.settings.welcomeMessage}
            rows={3}
            onBlur={(e) => {
              updateEventSettings(eventId, { welcomeMessage: e.target.value });
              refresh();
            }}
          />
          <p className="text-xs text-warm-gray">Couple homepage: /wedding/{eventId}</p>
        </div>
      )}

      {tab === "limits" && (
        <PhotoLimitManager event={event} stats={stats} onRefresh={refresh} />
      )}

      {tab === "hero" && <HeroBannerEditor event={event} onRefresh={refresh} />}

      {tab === "theme" && <ThemeManager event={event} onRefresh={refresh} />}

      {tab === "slideshow" && (
        <SlideshowSettingsPanel event={event} onRefresh={refresh} />
      )}

      {tab === "templates" && (
        <TemplateManager eventId={eventId} onRefresh={refresh} />
      )}

      {tab === "moderation" && (
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={event.moderation.autoApprove}
              onChange={(e) => {
                updateModeration(eventId, { autoApprove: e.target.checked });
                refresh();
              }}
            />
            Auto-approve uploads
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={event.moderation.uploadsDisabled}
              onChange={(e) => {
                updateModeration(eventId, { uploadsDisabled: e.target.checked });
                refresh();
              }}
            />
            Disable uploads after event
          </label>
          {pending.length > 0 && (
            <Button variant="gold" size="sm" onClick={() => { approveAllPending(eventId); refresh(); }}>
              Approve All ({pending.length})
            </Button>
          )}
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {uploads.filter((u) => u.status !== "removed").map((upload) => (
              <div key={upload.id} className="flex gap-3 p-3 rounded-xl bg-white border border-champagne/10">
                <img src={upload.imageData} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{formatGuestNamePOV(upload.guestName)}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blush text-warm-gray">{upload.status}</span>
                </div>
                <div className="flex flex-col gap-1">
                  {upload.status === "pending" && (
                    <button onClick={() => { updateUploadStatus(upload.id, "approved"); refresh(); }} className="p-1.5 rounded-lg bg-green-50 text-green-600"><Check className="w-4 h-4" /></button>
                  )}
                  <button onClick={() => { deleteUpload(upload.id); refresh(); }} className="p-1.5 rounded-lg bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "guests" && (
        <GuestManagementPanel event={event} onRefresh={refresh} />
      )}

      {tab === "archive" && (
        <EventArchiveManager
          eventId={eventId}
          event={event}
          stats={stats}
          onRefresh={refresh}
        />
      )}

      {tab === "highlights" && <HighlightsReel uploads={getApprovedUploads(eventId)} />}
    </div>
  );
}

export { AdminDashboard as CoupleDashboard };
