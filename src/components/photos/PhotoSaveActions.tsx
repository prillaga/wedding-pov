"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  getSavePhotoLabel,
  saveImageToDevice,
  shareImage,
} from "@/lib/image-utils";
import { Download, Share2 } from "lucide-react";

interface PhotoSaveActionsProps {
  imageData: string;
  filename: string;
  title?: string;
  isVideo?: boolean;
  variant?: "dark" | "light";
  showShare?: boolean;
  className?: string;
}

export function PhotoSaveActions({
  imageData,
  filename,
  title,
  isVideo = false,
  variant = "light",
  showShare = true,
  className = "",
}: PhotoSaveActionsProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveLabel = saved ? "Saved!" : getSavePhotoLabel(isVideo);
  const SaveIcon = Download;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const result = await saveImageToDevice(imageData, filename, { title, isVideo });
    setSaving(false);
    if (result.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else if (result.error && !result.cancelled) {
      alert(result.error);
    }
  };

  const handleShare = async () => {
    const ok = await shareImage(imageData, title ?? "Wedding POV");
    if (!ok) {
      alert("Sharing is not supported on this device.");
    }
  };

  const secondaryClass =
    variant === "dark"
      ? "flex-1 text-ivory border-white/20"
      : "flex-1";

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant={variant === "dark" ? "secondary" : "gold"}
        size="sm"
        className={variant === "dark" ? "flex-1 bg-white/10 text-ivory border-white/20 hover:bg-white/20" : "flex-1"}
        loading={saving}
        onClick={handleSave}
      >
        <SaveIcon className="w-4 h-4" /> {saveLabel}
      </Button>
      {showShare && (
        <Button
          variant="secondary"
          size="sm"
          className={secondaryClass}
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4" /> Share
        </Button>
      )}
    </div>
  );
}
