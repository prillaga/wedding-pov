"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PrintInstructionsModal({
  open,
  imageUrl,
  onOpenImage,
  onMarkPrinted,
  onClose,
  marking,
}: {
  open: boolean;
  imageUrl: string;
  onOpenImage: () => void;
  onMarkPrinted: () => void;
  onClose: () => void;
  marking?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md rounded-3xl bg-ivory p-6 md:p-8 luxury-shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="p-3 rounded-2xl bg-champagne/15">
                <Printer className="w-8 h-8 text-champagne" />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-blush touch-target"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-warm-gray" />
              </button>
            </div>

            <h3 className="mt-4 font-serif text-2xl text-charcoal">Print with Xiaomi</h3>
            <p className="mt-3 text-sm text-warm-gray leading-relaxed">
              Open the <strong className="text-charcoal">Xiaomi Photo Printer App</strong> and
              select this image. The full-resolution file has been downloaded and opened in a new
              tab.
            </p>

            <ol className="mt-4 space-y-2 text-sm text-warm-gray list-decimal list-inside">
              <li>Open Xiaomi Photo Printer app on your phone</li>
              <li>Tap Print Photo → choose the downloaded image</li>
              <li>Use 2×3&quot; photo paper (portrait)</li>
              <li>Return here and tap Mark as Printed</li>
            </ol>

            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={onOpenImage} className="w-full flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Open Image
              </Button>
              <Button
                variant="secondary"
                onClick={onMarkPrinted}
                disabled={marking}
                className="w-full"
              >
                {marking ? "Saving…" : "Mark as Printed"}
              </Button>
              <Button variant="ghost" onClick={onClose} className="w-full">
                Close
              </Button>
            </div>

            {imageUrl && (
              <p className="mt-4 text-[10px] text-warm-gray/60 truncate">{imageUrl}</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
