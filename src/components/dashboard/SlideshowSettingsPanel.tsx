"use client";

import { Input, Select } from "@/components/ui/Input";
import {
  SLIDESHOW_DURATION_OPTIONS,
  SLIDESHOW_PRESENTATION_STYLES,
  SLIDESHOW_STYLES,
} from "@/lib/constants";
import { updateSlideshow } from "@/lib/store";
import type { SlideshowConfig, WeddingEvent } from "@/types";
import { SlideshowMusicPanel } from "./SlideshowMusicPanel";

interface SlideshowSettingsPanelProps {
  event: WeddingEvent;
  onRefresh: () => void;
}

export function SlideshowSettingsPanel({ event, onRefresh }: SlideshowSettingsPanelProps) {
  const { slideshow } = event;

  const patch = (data: Partial<SlideshowConfig>) => {
    updateSlideshow(event.id, data);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <SlideshowMusicPanel event={event} onRefresh={onRefresh} compact />

      <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-4">
        <h3 className="font-medium">Transition & Display</h3>
        <p className="text-xs text-warm-gray">
          Fullscreen presentation supports fade, zoom, and cinematic pan transitions.
        </p>
        <Select
          label="Transition Style"
          options={SLIDESHOW_STYLES.map((s) => ({ value: s.value, label: s.label }))}
          value={slideshow.style}
          onChange={(e) => patch({ style: e.target.value as SlideshowConfig["style"] })}
        />
        <div className="flex flex-wrap gap-2">
          {SLIDESHOW_PRESENTATION_STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => patch({ style: s.value })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                slideshow.style === s.value
                  ? "bg-champagne text-white border-champagne"
                  : "border-champagne/20 text-warm-gray hover:bg-blush"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div>
          <p className="text-sm font-medium text-warm-gray mb-2">Photo Duration</p>
          <p className="text-xs text-warm-gray mb-2">
            Used when beat sync is off. When beat sync is on, slides follow the music tempo.
          </p>
          <div className="flex flex-wrap gap-2">
            {SLIDESHOW_DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => patch({ transitionDuration: opt.value })}
                className={`min-w-[3rem] px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                  slideshow.transitionDuration === opt.value
                    ? "bg-champagne text-white border-champagne"
                    : "border-champagne/20 text-warm-gray hover:bg-blush"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={slideshow.showGuestNames}
            onChange={(e) => patch({ showGuestNames: e.target.checked })}
          />
          Show guest names
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={slideshow.showTimestamp}
            onChange={(e) => patch({ showTimestamp: e.target.checked })}
          />
          Show timestamps & event section
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={slideshow.showPhotoCount}
            onChange={(e) => patch({ showPhotoCount: e.target.checked })}
          />
          Show photo count (TV / display mode)
        </label>
      </section>

      <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-3">
        <h3 className="font-medium">Intro Screen</h3>
        <Input
          label="Title"
          defaultValue={slideshow.intro.title}
          onBlur={(e) => patch({ intro: { ...slideshow.intro, title: e.target.value } })}
        />
        <Input
          label="Subtitle"
          defaultValue={slideshow.intro.subtitle}
          onBlur={(e) => patch({ intro: { ...slideshow.intro, subtitle: e.target.value } })}
        />
        <Input
          label="Line 3"
          defaultValue={slideshow.intro.line3}
          onBlur={(e) => patch({ intro: { ...slideshow.intro, line3: e.target.value } })}
        />
        <Input
          label="Date"
          defaultValue={slideshow.intro.date}
          onBlur={(e) => patch({ intro: { ...slideshow.intro, date: e.target.value } })}
        />
      </section>

      <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-3">
        <h3 className="font-medium">Outro Screen</h3>
        <Input
          label="Title"
          defaultValue={slideshow.outro.title}
          onBlur={(e) => patch({ outro: { ...slideshow.outro, title: e.target.value } })}
        />
        <Input
          label="Subtitle"
          defaultValue={slideshow.outro.subtitle}
          onBlur={(e) => patch({ outro: { ...slideshow.outro, subtitle: e.target.value } })}
        />
        <Input
          label="Line 3"
          defaultValue={slideshow.outro.line3}
          onBlur={(e) => patch({ outro: { ...slideshow.outro, line3: e.target.value } })}
        />
      </section>
    </div>
  );
}
