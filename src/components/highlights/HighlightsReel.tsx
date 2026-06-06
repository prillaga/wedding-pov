"use client";

import { useState } from "react";
import { LiveSlideshow } from "@/components/slideshow/LiveSlideshow";
import type { HighlightReelType, Upload } from "@/types";
import { Clapperboard, Film, Sparkles } from "lucide-react";

const CONFIG: Record<HighlightReelType, { label: string; interval: number; icon: React.ReactNode }> = {
  "1min": { label: "1-Minute Highlight", interval: 3000, icon: <Sparkles className="w-5 h-5" /> },
  "3min": { label: "3-Minute Cinematic", interval: 5000, icon: <Film className="w-5 h-5" /> },
  full: { label: "Full Event Recap", interval: 4000, icon: <Clapperboard className="w-5 h-5" /> },
};

export function HighlightsReel({ uploads }: { uploads: Upload[] }) {
  const [selected, setSelected] = useState<HighlightReelType | null>(null);

  if (selected) {
    const c = CONFIG[selected];
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="text-sm text-champagne">← Back</button>
        <LiveSlideshow uploads={uploads} interval={c.interval} autoPlay showTimestamp />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(Object.keys(CONFIG) as HighlightReelType[]).map((type) => (
        <button key={type} onClick={() => setSelected(type)} disabled={!uploads.length}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 text-left disabled:opacity-50">
          <div className="p-3 rounded-xl bg-blush text-champagne">{CONFIG[type].icon}</div>
          <div>
            <p className="font-medium">{CONFIG[type].label}</p>
            <p className="text-sm text-warm-gray">Generate highlight reel</p>
          </div>
        </button>
      ))}
    </div>
  );
}
