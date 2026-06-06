"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { POVBadge } from "@/components/layout/PageHeader";
import { PhotoSaveActions } from "@/components/photos/PhotoSaveActions";
import { GALLERY_SORT_OPTIONS } from "@/lib/constants";
import { getEvent } from "@/lib/store";
import { formatGuestNamePOV, getSegmentLabel } from "@/lib/utils";
import type { GallerySort, Upload } from "@/types";
import { ChevronDown, ChevronRight, X } from "lucide-react";

interface POVGalleryProps {
  eventId: string;
  uploads: Upload[];
}

function GalleryPhotoModal({
  upload,
  onClose,
}: {
  upload: Upload;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex flex-col"
    >
      <div className="flex items-center justify-between p-4 safe-top safe-x">
        <POVBadge name={upload.guestName} size="sm" />
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 text-ivory touch-target"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        {upload.isVideo ? (
          <video src={upload.imageData} controls className="max-w-full max-h-full" />
        ) : (
          <img
            src={upload.imageData}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>
      {upload.caption && (
        <p className="text-center text-ivory/80 italic px-4 pb-2">{upload.caption}</p>
      )}
      <div className="p-4 safe-bottom safe-x">
        <PhotoSaveActions
          imageData={upload.imageData}
          filename={`${upload.guestName.replace(/\s+/g, "-")}-POV-${upload.id.slice(0, 6)}.jpg`}
          title={formatGuestNamePOV(upload.guestName)}
          isVideo={upload.isVideo}
          variant="dark"
        />
      </div>
    </motion.div>
  );
}

export function POVGallery({ eventId, uploads }: POVGalleryProps) {
  const [sort, setSort] = useState<GallerySort>("guest");
  const [expandedGuest, setExpandedGuest] = useState<string | null>(null);
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);
  const event = getEvent(eventId);
  const maxPhotos = event?.photoLimits.maxPhotos ?? 10;

  const active = useMemo(
    () => uploads.filter((u) => u.status !== "removed"),
    [uploads]
  );

  const guestGroups = useMemo(() => {
    const map = new Map<string, Upload[]>();
    active.forEach((u) => {
      const list = map.get(u.guestName) ?? [];
      list.push(u);
      map.set(u.guestName, list);
    });
    return [...map.entries()]
      .map(([name, photos]) => ({
        name,
        photos: photos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        count: photos.filter((p) => !p.isExtra).length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [active]);

  const sortedFlat = useMemo(() => {
    const list = [...active];
    switch (sort) {
      case "newest":
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "timeline":
        return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case "segment":
        return list.sort((a, b) => a.segment.localeCompare(b.segment));
      default:
        return list;
    }
  }, [active, sort]);

  if (sort === "guest") {
    return (
      <>
        <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {GALLERY_SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium shrink-0 transition-all ${
                sort === opt.value ? "bg-champagne text-white" : "bg-blush text-warm-gray"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {guestGroups.map((group, i) => {
            const max = maxPhotos === "unlimited" ? null : maxPhotos;
            const label = max ? `${group.count} / ${max} Photos` : `${group.count} Photos`;
            const open = expandedGuest === group.name;

            return (
              <motion.div
                key={group.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl bg-white wedding-shadow border border-champagne/10 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedGuest(open ? null : group.name)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-blush/30 transition-colors"
                >
                  <div>
                    <POVBadge name={group.name} size="md" />
                    <p className="text-sm text-champagne mt-1 font-medium">{label}</p>
                  </div>
                  {open ? <ChevronDown className="w-5 h-5 text-warm-gray" /> : <ChevronRight className="w-5 h-5 text-warm-gray" />}
                </button>
                {open && (
                  <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                    {group.photos.map((upload) => (
                      <button
                        key={upload.id}
                        type="button"
                        onClick={() => setSelectedUpload(upload)}
                        className="rounded-xl overflow-hidden aspect-square relative"
                      >
                        <img src={upload.imageData} alt="" className="w-full h-full object-cover" />
                        {upload.isExtra && (
                          <span className="absolute top-1 right-1 text-[8px] bg-charcoal/70 text-ivory px-1.5 py-0.5 rounded-full">
                            Extra
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
        </div>

        <AnimatePresence>
          {selectedUpload && (
            <GalleryPhotoModal upload={selectedUpload} onClose={() => setSelectedUpload(null)} />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {GALLERY_SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium shrink-0 transition-all ${
              sort === opt.value ? "bg-champagne text-white" : "bg-blush text-warm-gray"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sortedFlat.map((upload, i) => (
          <motion.button
            key={upload.id}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => setSelectedUpload(upload)}
            className="rounded-2xl overflow-hidden wedding-shadow bg-white text-left"
          >
            <img src={upload.imageData} alt="" className="w-full aspect-[4/5] object-cover" />
            <div className="p-3">
              <POVBadge name={upload.guestName} size="sm" />
              {upload.caption && <p className="text-xs text-warm-gray mt-1 italic line-clamp-2">{upload.caption}</p>}
              <p className="text-[10px] text-champagne/70 mt-1">{getSegmentLabel(upload.segment)}</p>
            </div>
          </motion.button>
        ))}
      </div>
      </div>

      <AnimatePresence>
        {selectedUpload && (
          <GalleryPhotoModal upload={selectedUpload} onClose={() => setSelectedUpload(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
