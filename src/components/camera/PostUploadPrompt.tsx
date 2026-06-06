"use client";

import { Button } from "@/components/ui/Button";
import { Camera, Grid3X3 } from "lucide-react";

interface PostUploadPromptProps {
  onContinueCamera: () => void;
  onViewGallery: () => void;
}

export function PostUploadPrompt({ onContinueCamera, onViewGallery }: PostUploadPromptProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-charcoal border border-white/10 p-5 space-y-4 shadow-xl">
        <div className="text-center">
          <p className="text-ivory font-serif text-lg">Photo uploaded successfully.</p>
          <p className="text-ivory/60 text-sm mt-1">What would you like to do next?</p>
        </div>
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
