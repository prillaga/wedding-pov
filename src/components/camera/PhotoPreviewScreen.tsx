"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { FILTERS } from "@/lib/constants";
import { applyFilterToImage, centerSquareCrop } from "@/lib/image-utils";
import { formatGuestPOV } from "@/lib/utils";
import type { CameraFilter, Guest, PhotoManagementSettings } from "@/types";
import {
  Check,
  Crop,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  Upload,
} from "lucide-react";

interface PhotoPreviewScreenProps {
  guest: Guest;
  imageData: string;
  isVideo?: boolean;
  filter: CameraFilter;
  caption: string;
  markAsExtra?: boolean;
  replaceMode?: boolean;
  settings: PhotoManagementSettings;
  uploading?: boolean;
  onFilterChange: (filter: CameraFilter) => void;
  onCaptionChange: (caption: string) => void;
  onImageChange: (imageData: string) => void;
  onRetake: () => void;
  onDelete: () => void;
  onUpload: () => void;
}

export function PhotoPreviewScreen({
  guest,
  imageData,
  isVideo,
  filter,
  caption,
  markAsExtra,
  replaceMode,
  settings,
  uploading,
  onFilterChange,
  onCaptionChange,
  onImageChange,
  onRetake,
  onDelete,
  onUpload,
}: PhotoPreviewScreenProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFilterSelect = async (next: CameraFilter) => {
    if (isVideo) {
      onFilterChange(next);
      return;
    }
    setProcessing(true);
    try {
      const filtered = await applyFilterToImage(imageData, next);
      onImageChange(filtered);
      onFilterChange(next);
    } finally {
      setProcessing(false);
    }
  };

  const handleCrop = async () => {
    if (isVideo) return;
    setProcessing(true);
    try {
      const cropped = await centerSquareCrop(imageData);
      onImageChange(cropped);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col min-h-0"
    >
      <div className="relative flex-1 min-h-0 bg-black">
        {isVideo ? (
          <video
            src={imageData}
            controls
            autoPlay
            loop
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            src={imageData}
            alt="Photo preview"
            className="w-full h-full object-contain"
          />
        )}
        {processing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <p className="text-ivory text-sm">Processing…</p>
          </div>
        )}
        <div className="absolute top-3 left-3 right-3">
          <p className="text-center text-xs text-ivory/80 uppercase tracking-wider">
            Photo Preview
          </p>
        </div>
      </div>

      <div className="p-4 bg-charcoal/95 space-y-3 safe-bottom border-t border-white/10">
        <p className="text-champagne text-sm font-serif text-center">
          {formatGuestPOV(guest)}
        </p>
        {markAsExtra && (
          <p className="text-xs text-center text-ivory/60">Extra upload (over limit)</p>
        )}
        {replaceMode && (
          <p className="text-xs text-center text-champagne/80">
            Confirm to replace your existing photo
          </p>
        )}

        {!isVideo && (
          <>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center justify-center gap-2 w-full py-2 text-xs text-ivory/70"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {showFilters ? "Hide Filters" : "Apply Filter"}
            </button>
            {showFilters && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => handleFilterSelect(f.value)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${
                      filter === f.value
                        ? "bg-champagne text-white"
                        : "bg-white/10 text-ivory/80"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-ivory/80"
              onClick={handleCrop}
              disabled={processing}
            >
              <Crop className="w-4 h-4" /> Crop Photo
            </Button>
          </>
        )}

        <input
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Add a caption (optional)"
          className="w-full px-4 py-2.5 rounded-xl bg-white/10 text-ivory placeholder:text-ivory/40 border border-white/10 text-sm"
        />

        <div className="grid grid-cols-2 gap-2">
          {settings.retakeBeforeUpload && (
            <Button variant="ghost" className="text-ivory" onClick={onRetake}>
              <RotateCcw className="w-4 h-4" /> Retake
            </Button>
          )}
          {settings.deleteBeforeUpload && (
            <Button variant="ghost" className="text-red-300" onClick={onDelete}>
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          )}
        </div>

        <Button variant="gold" className="w-full" loading={uploading} onClick={onUpload}>
          {replaceMode ? (
            <>
              <Check className="w-4 h-4" /> Confirm Replace
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" /> Upload Photo
            </>
          )}
        </Button>

        <p className="text-[10px] text-center text-ivory/40">
          Retake & delete before upload do not count toward your photo limit.
        </p>
      </div>
    </motion.div>
  );
}
