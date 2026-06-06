"use client";

import { Button } from "@/components/ui/Button";
import { PhotoSaveActions } from "@/components/photos/PhotoSaveActions";
import { Camera, Grid3X3 } from "lucide-react";

interface PostUploadPromptProps {
  imageData?: string;
  filename?: string;
  title?: string;
  isVideo?: boolean;
  onContinueCamera: () => void;
  onViewGallery: () => void;
}

export function PostUploadPrompt({
  imageData,
  filename = "wedding-pov.jpg",
  title = "Wedding POV",
  isVideo = false,
  onContinueCamera,
  onViewGallery,
}: PostUploadPromptProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 safe-bottom">
      <div className="w-full max-w-sm rounded-2xl bg-charcoal border border-white/10 p-5 space-y-4 shadow-xl max-h-[min(90dvh,560px)] overflow-y-auto touch-scroll-y">
        <div className="text-center">
          <p className="text-ivory font-serif text-lg">Photo uploaded successfully.</p>
          <p className="text-ivory/60 text-sm mt-1">What would you like to do next?</p>
        </div>
        {imageData && (
          <PhotoSaveActions
            imageData={imageData}
            filename={filename}
            title={title}
            isVideo={isVideo}
            variant="dark"
          />
        )}
        <Button variant="gold" className="w-full" onClick={onContinueCamera}>
          <Camera className="w-4 h-4" /> Keep Taking Photos
        </Button>
        <Button variant="ghost" className="w-full text-ivory" onClick={onViewGallery}>
          <Grid3X3 className="w-4 h-4" /> View Gallery
        </Button>
      </div>
    </div>
  );
}
