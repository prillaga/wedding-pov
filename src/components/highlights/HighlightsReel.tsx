"use client";

import { useMemo, useState } from "react";
import { LiveSlideshow } from "@/components/slideshow/LiveSlideshow";
import { useEventPhotos } from "@/hooks/useEventPhotos";
import { buildHighlightReel, countUniqueGuests } from "@/lib/highlight-reel";
import type { HighlightReelType } from "@/types";
import { Clapperboard, Film, Sparkles } from "lucide-react";

const CONFIG: Record<
  HighlightReelType,
  { label: string; interval: number; icon: React.ReactNode; description: string }
> = {
  "1min": {
    label: "1-Minute Highlight",
    interval: 3000,
    icon: <Sparkles className="w-5 h-5" />,
    description: "Quick mix of every guest's POV",
  },
  "3min": {
    label: "3-Minute Cinematic",
    interval: 5000,
    icon: <Film className="w-5 h-5" />,
    description: "Curated rotation across all devices",
  },
  full: {
    label: "Full Event Recap",
    interval: 4000,
    icon: <Clapperboard className="w-5 h-5" />,
    description: "Every guest memory, interleaved",
  },
};

export function HighlightsReel({ eventId }: { eventId: string }) {
  const [selected, setSelected] = useState<HighlightReelType | null>(null);
  const { photos, loading } = useEventPhotos(eventId, { pollIntervalMs: 4000 });

  const guestCount = useMemo(() => countUniqueGuests(photos), [photos]);
  const reelPhotos = useMemo(
    () => (selected ? buildHighlightReel(photos, selected) : []),
    [photos, selected]
  );

  if (selected) {
    const c = CONFIG[selected];
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="text-sm text-champagne">
          ← Back
        </button>
        <p className="text-sm text-warm-gray">
          AI highlight reel · {guestCount} guest{guestCount === 1 ? "" : "s"} · {reelPhotos.length}{" "}
          photo{reelPhotos.length === 1 ? "" : "s"}
        </p>
        <LiveSlideshow
          uploads={reelPhotos}
          loading={loading}
          interval={c.interval}
          autoPlay
          showTimestamp
          showGuestNames
          loop
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-warm-gray mb-4">
        Builds a mixed highlight reel from every guest on every device — not just one POV.
        {photos.length > 0 && (
          <span className="block mt-1 text-charcoal">
            {guestCount} guest{guestCount === 1 ? "" : "s"} · {photos.length} photo
            {photos.length === 1 ? "" : "s"} synced
          </span>
        )}
      </p>
      {(Object.keys(CONFIG) as HighlightReelType[]).map((type) => (
        <button
          key={type}
          onClick={() => setSelected(type)}
          disabled={!photos.length}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 text-left disabled:opacity-50"
        >
          <div className="p-3 rounded-xl bg-blush text-champagne">{CONFIG[type].icon}</div>
          <div>
            <p className="font-medium">{CONFIG[type].label}</p>
            <p className="text-sm text-warm-gray">{CONFIG[type].description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
