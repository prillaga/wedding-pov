"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Printer,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type { PrintCenterPhoto } from "@/types/print-center";
import { AI_HIGHLIGHT_LABELS } from "@/types/print-center";
import { Button } from "@/components/ui/Button";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PhotoPreviewModal({
  photo,
  onClose,
  onPrint,
  onDownload,
  onFavorite,
  onDelete,
  busy,
}: {
  photo: PrintCenterPhoto | null;
  onClose: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onFavorite: () => void;
  onDelete: () => void;
  busy?: boolean;
}) {
  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 bg-charcoal/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full max-w-4xl max-h-[95dvh] overflow-hidden rounded-t-3xl md:rounded-3xl bg-ivory luxury-shadow flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-charcoal/50 text-white hover:bg-charcoal/70 touch-target"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex-1 overflow-y-auto touch-scroll-y">
              <div className="bg-charcoal flex items-center justify-center min-h-[40dvh] max-h-[60dvh]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageUrl}
                  alt={photo.guestName}
                  className="max-w-full max-h-[60dvh] object-contain"
                />
              </div>

              <div className="p-5 md:p-6 space-y-4">
                <div>
                  <h2 className="font-serif text-2xl text-charcoal">{photo.eventName}</h2>
                  <p className="text-warm-gray mt-1">
                    {photo.guestName} · {formatTime(photo.createdAt)}
                  </p>
                  {photo.caption && (
                    <p className="mt-2 text-sm text-charcoal/80 italic">&ldquo;{photo.caption}&rdquo;</p>
                  )}
                </div>

                {photo.aiHighlightType && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-200">
                    ⭐ {AI_HIGHLIGHT_LABELS[photo.aiHighlightType]}
                    {photo.aiScore != null && (
                      <span className="text-amber-700/70">· AI score coming soon</span>
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-blush p-4 md:p-5 grid grid-cols-2 md:grid-cols-4 gap-2 safe-bottom bg-ivory">
              <Button
                onClick={onPrint}
                disabled={busy}
                className="col-span-2 md:col-span-1 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button
                variant="secondary"
                onClick={onDownload}
                disabled={busy}
                className="flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button
                variant="secondary"
                onClick={onFavorite}
                disabled={busy}
                className="flex items-center justify-center gap-2"
              >
                <Star
                  className={`w-4 h-4 ${photo.isFavorite ? "fill-champagne text-champagne" : ""}`}
                />
                {photo.isFavorite ? "Unfavorite" : "Favorite"}
              </Button>
              <Button
                variant="ghost"
                onClick={onDelete}
                disabled={busy}
                className="flex items-center justify-center gap-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
