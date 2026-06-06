"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { POVBadge } from "@/components/layout/PageHeader";
import { PhotoSaveActions } from "@/components/photos/PhotoSaveActions";
import { getGuestUploadQuota } from "@/lib/photo-limits";
import {
  deleteGuestUpload,
  getAllUploadsForQuota,
  getEvent,
  getGuestUploads,
} from "@/lib/store";
import { formatGuestNamePOV, formatGuestPOV } from "@/lib/utils";
import type { Guest, Upload } from "@/types";
import {
  Eye,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

interface MyUploadsProps {
  eventId: string;
  guest: Guest;
  onReplace?: (uploadId: string) => void;
  onChange?: () => void;
}

export function MyUploads({ eventId, guest, onReplace, onChange }: MyUploadsProps) {
  const event = getEvent(eventId);
  const [viewUpload, setViewUpload] = useState<Upload | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const uploads = useMemo(
    () => getGuestUploads(eventId, guest.id),
    [eventId, guest.id, refreshKey]
  );

  const quota = useMemo(() => {
    const all = getAllUploadsForQuota(eventId);
    return getGuestUploadQuota(
      event?.photoLimits ?? { enabled: false, type: "total", maxPhotos: 10, limitReachedBehavior: "block" },
      all,
      guest.id
    );
  }, [eventId, guest.id, event?.photoLimits, refreshKey]);

  const settings = event?.photoManagement;
  const guestName = `${guest.firstName} ${guest.lastName}`;

  const refresh = () => {
    setRefreshKey((k) => k + 1);
    onChange?.();
  };

  const handleDelete = (upload: Upload) => {
    if (!settings?.deleteAfterUpload) return;
    const restoreSlot = settings.restoreSlotAfterDelete;
    const msg = restoreSlot
      ? "Delete this photo? Your upload slot will be restored."
      : "Delete this photo? This will NOT restore your upload slot.";
    if (!confirm(msg)) return;

    deleteGuestUpload(upload.id, guest.id, restoreSlot);
    refresh();
    setViewUpload(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <POVBadge name={guestName} />
          <p className="text-xs text-warm-gray mt-1">
            {quota.isLimited && quota.max !== null
              ? `${quota.used} / ${quota.max} Photos`
              : `${quota.used} Photos`}
          </p>
        </div>
      </div>

      {uploads.length === 0 ? (
        <p className="text-sm text-warm-gray text-center py-8">
          You haven&apos;t uploaded any photos yet.
        </p>
      ) : (
        <div className="space-y-3">
          {uploads.map((upload, index) => (
            <motion.div
              key={upload.id}
              layout
              className="flex gap-3 p-3 rounded-2xl bg-white border border-champagne/10 wedding-shadow"
            >
              <button
                type="button"
                onClick={() => setViewUpload(upload)}
                className="w-16 h-16 rounded-xl overflow-hidden shrink-0"
              >
                <img
                  src={upload.imageData}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Photo {uploads.length - index}</p>
                {upload.caption && (
                  <p className="text-xs text-warm-gray truncate mt-0.5">{upload.caption}</p>
                )}
                <p className="text-[10px] text-warm-gray mt-1">
                  {new Date(upload.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewUpload(upload)}
                  className="p-2 rounded-lg bg-blush text-warm-gray"
                  title="View"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {settings?.replaceUploadedPhotos && onReplace && (
                  <button
                    type="button"
                    onClick={() => onReplace(upload.id)}
                    className="p-2 rounded-lg bg-blush text-champagne"
                    title="Replace"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                {settings?.deleteAfterUpload && (
                  <button
                    type="button"
                    onClick={() => handleDelete(upload)}
                    className="p-2 rounded-lg bg-red-50 text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {viewUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 safe-top">
              <p className="text-ivory font-serif">{formatGuestPOV(guest)}</p>
              <button
                type="button"
                onClick={() => setViewUpload(null)}
                className="p-2 rounded-full bg-white/10 text-ivory"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 min-h-0">
              {viewUpload.isVideo ? (
                <video
                  src={viewUpload.imageData}
                  controls
                  className="max-w-full max-h-full"
                />
              ) : (
                <img
                  src={viewUpload.imageData}
                  alt=""
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
            {viewUpload.caption && (
              <p className="text-center text-ivory/80 italic px-4 pb-2">{viewUpload.caption}</p>
            )}
            <div className="p-4 safe-bottom space-y-3">
              <PhotoSaveActions
                imageData={viewUpload.imageData}
                filename={`${guestName.replace(/\s+/g, "-")}-POV-${viewUpload.id.slice(0, 6)}.jpg`}
                title={formatGuestNamePOV(guestName)}
                isVideo={viewUpload.isVideo}
                variant="dark"
              />
              {settings?.deleteAfterUpload && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-red-400"
                  onClick={() => handleDelete(viewUpload)}
                >
                  <Trash2 className="w-4 h-4" /> Delete Photo
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
