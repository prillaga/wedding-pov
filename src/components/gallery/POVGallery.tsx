"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { POVBadge } from "@/components/layout/PageHeader";
import { PhotoSaveActions } from "@/components/photos/PhotoSaveActions";
import { Button } from "@/components/ui/Button";
import { GALLERY_SORT_OPTIONS } from "@/lib/constants";
import { getEvent } from "@/lib/store";
import { formatGuestNamePOV, formatRelativeTime, getSegmentLabel } from "@/lib/utils";
import type { GallerySort, Upload } from "@/types";
import { Camera, ChevronDown, ChevronRight, X } from "lucide-react";

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

function GalleryEmptyState({ eventId }: { eventId: string }) {
  return (
    <div className="luxury-glass rounded-[28px] border border-champagne/12 p-8 sm:p-12 text-center luxury-shadow">
      <div className="text-4xl mb-4">📷</div>
      <h2 className="font-serif text-2xl text-charcoal">No Memories Yet</h2>
      <p className="text-sm text-warm-gray mt-2 leading-relaxed max-w-xs mx-auto">
        Be the first guest to share a wedding moment.
      </p>
      <Link href={`/event/${eventId}/camera`} className="inline-block mt-5">
        <Button variant="gold" size="lg">
          <Camera className="w-5 h-5" />
          Open Camera
        </Button>
      </Link>
    </div>
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
      .map(([name, photos]) => {
        const sorted = photos.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return {
          name,
          photos: sorted,
          count: photos.filter((p) => !p.isExtra).length,
          latestPhoto: sorted[0],
          latestUpload: sorted[0]?.createdAt,
        };
      })
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

  if (active.length === 0) {
    return <GalleryEmptyState eventId={eventId} />;
  }

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

          <div className="space-y-4">
            {guestGroups.map((group, i) => {
              const max = maxPhotos === "unlimited" ? null : maxPhotos;
              const countLabel = max ? `${group.count} / ${max} Photos` : `${group.count} Photos`;
              const open = expandedGuest === group.name;

              return (
                <motion.div
                  key={group.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-[24px] bg-white/90 luxury-glass border border-champagne/12 overflow-hidden luxury-shadow"
                >
                  <div className="flex items-stretch">
                    {group.latestPhoto && (
                      <button
                        type="button"
                        onClick={() => setSelectedUpload(group.latestPhoto!)}
                        className="shrink-0 w-24 sm:w-28 relative overflow-hidden"
                      >
                        <img
                          src={group.latestPhoto.imageData}
                          alt=""
                          className="w-full h-full object-cover min-h-[100px]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                      </button>
                    )}

                    <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                      <POVBadge name={group.name} size="md" />
                      <p className="text-sm text-champagne mt-1.5 font-medium">{countLabel}</p>
                      {group.latestUpload && (
                        <p className="text-xs text-warm-gray mt-0.5">
                          Latest Upload: {formatRelativeTime(group.latestUpload)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => setExpandedGuest(open ? null : group.name)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-champagne to-champagne-light text-white text-xs font-medium shadow-sm hover:shadow-md transition-shadow"
                        >
                          View POV
                          {open ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 grid grid-cols-3 gap-2 border-t border-champagne/10 pt-3">
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
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                {upload.caption && (
                  <p className="text-xs text-warm-gray mt-1 italic line-clamp-2">{upload.caption}</p>
                )}
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
