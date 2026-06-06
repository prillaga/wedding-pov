"use client";

import { Select } from "@/components/ui/Input";
import {
  getLimitNotification,
  LIMIT_TYPE_LABELS,
  PHOTO_LIMIT_OPTIONS,
  AFTER_UPLOAD_OPTIONS,
  VIDEO_DURATION_OPTIONS,
} from "@/lib/constants";
import { updatePhotoLimits, updatePhotoManagement, updateVideoLimits } from "@/lib/store";
import type {
  EventStats,
  LimitReachedBehavior,
  PhotoLimitType,
  PhotoLimitValue,
  WeddingEvent,
} from "@/types";

interface PhotoLimitManagerProps {
  event: WeddingEvent;
  stats: EventStats;
  onRefresh: () => void;
}

export function PhotoLimitManager({ event, stats, onRefresh }: PhotoLimitManagerProps) {
  const { photoLimits } = event;
  const maxLabel =
    photoLimits.maxPhotos === "unlimited" ? "∞" : String(photoLimits.maxPhotos);

  return (
    <div className="space-y-6">
      <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-4">
        <div>
          <h3 className="font-medium">Photo Limit Manager</h3>
          <p className="text-xs text-warm-gray mt-1">
            Default: 10 photos per guest. Control how many photos each guest can upload.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={photoLimits.enabled}
            onChange={(e) => {
              updatePhotoLimits(event.id, { enabled: e.target.checked });
              onRefresh();
            }}
          />
          Enable photo limits
        </label>

        <Select
          label="Limit Type"
          options={[
            { value: "total", label: "Per Guest Total (entire wedding)" },
            { value: "hourly", label: "Per Hour (e.g. 10 every hour)" },
            { value: "per-section", label: "Per Event Section (ceremony, reception…)" },
          ]}
          value={photoLimits.type}
          onChange={(e) => {
            updatePhotoLimits(event.id, { type: e.target.value as PhotoLimitType });
            onRefresh();
          }}
        />

        <div>
          <p className="text-sm font-medium text-warm-gray mb-2">Photos Per Guest</p>
          <div className="flex flex-wrap gap-2">
            {PHOTO_LIMIT_OPTIONS.map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  updatePhotoLimits(event.id, { maxPhotos: opt.value });
                  onRefresh();
                }}
                className={`min-w-[3rem] px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                  photoLimits.maxPhotos === opt.value
                    ? "bg-champagne text-white border-champagne"
                    : "border-champagne/20 text-warm-gray hover:bg-blush"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Select
          label="When Limit Reached"
          options={[
            { value: "block", label: "Block further uploads" },
            { value: "mark-extra", label: "Allow uploads but mark as extra" },
            { value: "unlimited", label: "Allow unlimited uploads" },
          ]}
          value={photoLimits.limitReachedBehavior}
          onChange={(e) => {
            updatePhotoLimits(event.id, {
              limitReachedBehavior: e.target.value as LimitReachedBehavior,
            });
            onRefresh();
          }}
        />

        {photoLimits.enabled && photoLimits.maxPhotos !== "unlimited" && (
          <div className="p-3 rounded-xl bg-blush/40 border border-champagne/15 text-sm">
            <p className="text-xs uppercase tracking-wider text-warm-gray mb-1">Guest Notification</p>
            <p className="italic text-charcoal">
              &ldquo;{getLimitNotification(photoLimits.maxPhotos)}&rdquo;
            </p>
          </div>
        )}
      </section>

      <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-4">
        <div>
          <h3 className="font-medium">Video Recording Limit</h3>
          <p className="text-xs text-warm-gray mt-1">
            Max length for each in-app video clip. Recording stops automatically at the limit.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-warm-gray mb-2">Max Video Length</p>
          <div className="flex flex-wrap gap-2">
            {VIDEO_DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  updateVideoLimits(event.id, { maxDurationSeconds: opt.value });
                  onRefresh();
                }}
                className={`min-w-[4rem] px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                  event.videoLimits.maxDurationSeconds === opt.value
                    ? "bg-champagne text-white border-champagne"
                    : "border-champagne/20 text-warm-gray hover:bg-blush"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-blush/40 border border-champagne/15 text-sm">
          <p className="text-xs uppercase tracking-wider text-warm-gray mb-1">Guest Camera</p>
          <p className="text-charcoal">
            Guests see a timer while recording and cannot exceed{" "}
            {VIDEO_DURATION_OPTIONS.find((o) => o.value === event.videoLimits.maxDurationSeconds)
              ?.label ?? "3 min"}
            .
          </p>
        </div>
      </section>

      <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10">
        <h3 className="font-medium mb-1">Live Limit Indicator Preview</h3>
        <p className="text-xs text-warm-gray mb-4">Shown on the camera screen for each guest.</p>

        <div
          className="rounded-2xl p-4 max-w-sm"
          style={{ background: event.theme.screenBackgrounds.camera }}
        >
          <p className="text-white text-sm font-medium mb-1">John Doe</p>
          <div className="h-2 rounded-full bg-white/15 overflow-hidden mb-1">
            <div
              className="h-full rounded-full"
              style={{
                width: "80%",
                background: event.theme.colors.progressBar,
              }}
            />
          </div>
          <p className="text-white/70 text-xs font-mono mb-1">████████░░</p>
          <p className="text-white/80 text-xs">
            8 / {maxLabel} Photos Used
          </p>
          <p className="text-white/60 text-xs mt-1">
            Remaining: {photoLimits.maxPhotos === "unlimited" ? "∞" : "2"} Photos
          </p>
        </div>
      </section>

      <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Guest Upload Status</h3>
          <span className="text-xs text-warm-gray">
            {LIMIT_TYPE_LABELS[photoLimits.type]}
          </span>
        </div>
        {stats.guestLimits.length === 0 ? (
          <p className="text-sm text-warm-gray">No guests have joined yet.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.guestLimits.map((guest) => (
              <div
                key={guest.guestId}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-blush/30 border border-champagne/10"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{guest.guestName}</p>
                  <div className="mt-1 h-1.5 rounded-full bg-white/60 overflow-hidden max-w-[140px]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width:
                          guest.max && guest.max > 0
                            ? `${Math.min(100, (guest.used / guest.max) * 100)}%`
                            : "0%",
                        background: guest.isAtLimit
                          ? "#E8C4B8"
                          : event.theme.colors.progressBar,
                      }}
                    />
                  </div>
                </div>
                <span
                  className={`text-sm font-medium shrink-0 ${
                    guest.isAtLimit ? "text-rose-gold" : "text-champagne"
                  }`}
                >
                  {guest.max === null
                    ? `${guest.used} photos`
                    : `${guest.used} / ${guest.max} Photos`}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-3">
        <h3 className="font-medium">Photo Review & Management</h3>
        <p className="text-xs text-warm-gray">
          Control retake, delete, replace, and whether deleting restores a photo slot.
        </p>
        {(
          [
            { key: "retakeBeforeUpload", label: "Retake before upload" },
            { key: "deleteBeforeUpload", label: "Delete before upload" },
            { key: "deleteAfterUpload", label: "Delete after upload" },
            { key: "replaceUploadedPhotos", label: "Replace uploaded photos" },
            { key: "restoreSlotAfterDelete", label: "Restore photo slot after delete" },
          ] as const
        ).map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={event.photoManagement[key]}
              onChange={(e) => {
                updatePhotoManagement(event.id, { [key]: e.target.checked });
                onRefresh();
              }}
            />
            {label}
          </label>
        ))}
        <p className="text-[10px] text-warm-gray pt-1">
          When &ldquo;Restore slot&rdquo; is off, deleting a photo removes it from the gallery but
          the guest stays at e.g. 10/10 used.
        </p>
      </section>

      <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-4">
        <div>
          <h3 className="font-medium">Camera Settings</h3>
          <p className="text-xs text-warm-gray mt-1">
            Continuous camera mode keeps guests on the camera screen for rapid photo capture.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-warm-gray mb-3">After Upload</p>
          <div className="space-y-2">
            {AFTER_UPLOAD_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  event.photoManagement.afterUploadBehavior === opt.value
                    ? "border-champagne bg-blush/40"
                    : "border-champagne/15 hover:bg-blush/20"
                }`}
              >
                <input
                  type="radio"
                  name="afterUploadBehavior"
                  value={opt.value}
                  checked={event.photoManagement.afterUploadBehavior === opt.value}
                  onChange={() => {
                    updatePhotoManagement(event.id, { afterUploadBehavior: opt.value });
                    onRefresh();
                  }}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium">
                    {opt.label}
                    {opt.value === "stay-in-camera" && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-champagne">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-warm-gray mt-0.5">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
