"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import {
  SLIDESHOW_BEATS_PER_SLIDE_OPTIONS,
  SLIDESHOW_DURATION_OPTIONS,
  SLIDESHOW_PRESENTATION_STYLES,
  SLIDESHOW_STYLES,
} from "@/lib/constants";
import { detectBpmFromFile } from "@/lib/audio-bpm";
import { uploadSlideshowMusicRemote } from "@/lib/music-remote";
import { updateSlideshow } from "@/lib/store";
import type { SlideshowConfig, SlideshowMusicSettings, WeddingEvent } from "@/types";
import { AudioLines, Music, Trash2, Upload } from "lucide-react";

interface SlideshowSettingsPanelProps {
  event: WeddingEvent;
  onRefresh: () => void;
}

const LOCAL_DATA_URL_MAX = 2 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function SlideshowSettingsPanel({ event, onRefresh }: SlideshowSettingsPanelProps) {
  const { slideshow } = event;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const patch = (data: Partial<SlideshowConfig>) => {
    updateSlideshow(event.id, data);
    onRefresh();
  };

  const patchMusic = (data: Partial<SlideshowMusicSettings>) => {
    patch({ music: { ...slideshow.music, ...data } });
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);

    try {
      const detectedBpm = await detectBpmFromFile(file);
      let trackUrl = slideshow.music.trackUrl;
      let trackName = file.name.replace(/\.[^.]+$/, "");

      const remote = await uploadSlideshowMusicRemote(event.id, file);
      if (remote.ok) {
        trackUrl = remote.trackUrl;
        trackName = remote.trackName;
        setUploadMessage("Music uploaded to cloud.");
      } else if (file.size <= LOCAL_DATA_URL_MAX) {
        trackUrl = await readFileAsDataUrl(file);
        setUploadMessage("Saved locally (connect Vercel Blob for TV/cross-device playback).");
      } else {
        setUploadMessage(remote.error ?? "Upload failed. Use a smaller file (under 4.5 MB).");
        return;
      }

      patchMusic({
        trackUrl,
        trackName,
        bpm: detectedBpm,
        enabled: true,
        syncToBeat: slideshow.music.syncToBeat ?? false,
      });
    } catch {
      setUploadMessage("Could not process audio file.");
    } finally {
      setUploading(false);
    }
  };

  const removeMusic = () => {
    patchMusic({
      trackUrl: undefined,
      trackName: undefined,
      enabled: false,
    });
    setUploadMessage(null);
  };

  return (
    <div className="space-y-4">
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

      <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-4">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-champagne" />
          <h3 className="font-medium">Background Music</h3>
        </div>
        <p className="text-xs text-warm-gray">
          Upload a wedding song (MP3, M4A, WAV). Enable beat sync so photo transitions land on the
          rhythm.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.m4a,.wav,.ogg"
          className="hidden"
          onChange={handleMusicUpload}
        />

        {slideshow.music.trackUrl ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-blush/40 border border-champagne/10">
            <AudioLines className="w-5 h-5 text-champagne shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {slideshow.music.trackName ?? "Uploaded track"}
              </p>
              {slideshow.music.bpm && (
                <p className="text-xs text-warm-gray">Detected tempo: {slideshow.music.bpm} BPM</p>
              )}
            </div>
            <button
              type="button"
              onClick={removeMusic}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50"
              aria-label="Remove music"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading…" : "Upload Music Track"}
          </Button>
        )}

        {slideshow.music.trackUrl && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            Replace Track
          </Button>
        )}

        {uploadMessage && <p className="text-xs text-warm-gray">{uploadMessage}</p>}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={slideshow.music.enabled}
            onChange={(e) => patchMusic({ enabled: e.target.checked })}
          />
          Enable background music in slideshow
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={slideshow.music.syncToBeat ?? false}
            disabled={!slideshow.music.trackUrl}
            onChange={(e) => patchMusic({ syncToBeat: e.target.checked })}
          />
          Sync photo transitions to the beat
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={slideshow.music.loop}
            onChange={(e) => patchMusic({ loop: e.target.checked })}
          />
          Loop music
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={slideshow.music.autoFade}
            onChange={(e) => patchMusic({ autoFade: e.target.checked })}
          />
          Fade out when slideshow ends
        </label>

        <Input
          label="Track Name (display)"
          defaultValue={slideshow.music.trackName ?? ""}
          placeholder="Our Song"
          onBlur={(e) => patchMusic({ trackName: e.target.value || undefined })}
        />

        <Input
          label="BPM (tempo)"
          type="number"
          min={60}
          max={180}
          defaultValue={slideshow.music.bpm ?? 120}
          onBlur={(e) => {
            const bpm = Number.parseInt(e.target.value, 10);
            if (bpm >= 60 && bpm <= 180) patchMusic({ bpm });
          }}
        />

        <div>
          <p className="text-sm font-medium text-warm-gray mb-2">Beats per photo</p>
          <div className="flex flex-wrap gap-2">
            {SLIDESHOW_BEATS_PER_SLIDE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => patchMusic({ beatsPerSlide: opt.value })}
                className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                  (slideshow.music.beatsPerSlide ?? 4) === opt.value
                    ? "bg-champagne text-white border-champagne"
                    : "border-champagne/20 text-warm-gray hover:bg-blush"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-warm-gray mb-2">
            Volume ({Math.round((slideshow.music.volume ?? 0.75) * 100)}%)
          </p>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round((slideshow.music.volume ?? 0.75) * 100)}
            onChange={(e) => patchMusic({ volume: Number(e.target.value) / 100 })}
            className="w-full accent-champagne"
          />
        </div>
      </section>
    </div>
  );
}
