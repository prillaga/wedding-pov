"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { PrintCenterPhoto } from "@/types/print-center";
import { AI_HIGHLIGHT_LABELS, type AiHighlightType } from "@/types/print-center";

function AiBadge({ type }: { type: AiHighlightType }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/90 text-amber-900 text-[10px] font-semibold backdrop-blur-sm">
      ⭐ {AI_HIGHLIGHT_LABELS[type]}
    </span>
  );
}

function formatUploadTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function PhotoMasonryGrid({
  photos,
  onSelect,
  loading,
}: {
  photos: PrintCenterPhoto[];
  onSelect: (photo: PrintCenterPhoto) => void;
  loading?: boolean;
}) {
  if (loading && photos.length === 0) {
    return (
      <div className="columns-2 md:columns-3 xl:columns-4 gap-3 md:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="mb-3 md:mb-4 break-inside-avoid rounded-2xl bg-blush/40 animate-pulse aspect-[3/4]"
          />
        ))}
      </div>
    );
  }

  if (!loading && photos.length === 0) {
    return (
      <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-champagne/30 bg-white/50">
        <p className="font-serif text-2xl text-charcoal">No photos yet</p>
        <p className="mt-2 text-sm text-warm-gray max-w-md mx-auto">
          Guest uploads will appear here as they scan your event QR code. Share the link to start collecting memories.
        </p>
      </div>
    );
  }

  return (
    <div className="columns-2 md:columns-3 xl:columns-4 gap-3 md:gap-4">
      {photos.map((photo, i) => (
        <motion.button
          key={photo.id}
          type="button"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: Math.min(i * 0.03, 0.3) }}
          onClick={() => onSelect(photo)}
          className="group mb-3 md:mb-4 break-inside-avoid w-full text-left rounded-2xl overflow-hidden luxury-shadow bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
        >
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.imageUrl}
              alt={`${photo.guestName} at ${photo.eventName}`}
              className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {photo.isFavorite && (
              <span className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 shadow">
                <Star className="w-4 h-4 fill-champagne text-champagne" />
              </span>
            )}
            {photo.aiHighlightType && (
              <div className="absolute top-2 left-2">
                <AiBadge type={photo.aiHighlightType} />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
              <p className="text-white text-sm font-medium truncate">{photo.guestName}</p>
              <p className="text-white/80 text-xs truncate">{photo.eventName}</p>
            </div>
          </div>
          <div className="p-3 md:hidden">
            <p className="text-sm font-medium text-charcoal truncate">{photo.guestName}</p>
            <p className="text-xs text-warm-gray">
              {formatUploadTime(photo.createdAt)}
            </p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
