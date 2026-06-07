"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SLIDESHOW_BEATS_PER_SLIDE_OPTIONS, DEFAULT_SLIDESHOW } from "@/lib/constants";
import { detectBpmFromFile } from "@/lib/audio-bpm";
import { uploadSlideshowMusicRemote } from "@/lib/music-remote";
import { updateSlideshow } from "@/lib/store";
import type { SlideshowMusicSettings, WeddingEvent } from "@/types";
import { AudioLines, Music, Trash2, Upload } from "lucide-react";

interface SlideshowMusicPanelProps {
  event: WeddingEvent;
  onRefresh: () => void;
  compact?: boolean;
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

export function SlideshowMusicPanel({ event, onRefresh, compact }: SlideshowMusicPanelProps) {
  const music = event.slideshow.music ?? DEFAULT_SLIDESHOW.music;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const patchMusic = (data: Partial<SlideshowMusicSettings>) => {
    updateSlideshow(event.id, {
      music: { ...music, ...data },
    });
    onRefresh();
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);

    try {
      const detectedBpm = await detectBpmFromFile(file);
      let trackUrl = music.trackUrl;
      let trackName = file.name.replace(/\.[^.]+$/, "");

      const remote = await uploadSlideshowMusicRemote(event.id, file);
      if (remote.ok) {
        trackUrl = remote.trackUrl;
        trackName = remote.trackName;
        setUploadMessage("Music uploaded — ready for slideshow & TV display.");
      } else if (file.size <= LOCAL_DATA_URL_MAX) {
        trackUrl = await readFileAsDataUrl(file);
        setUploadMessage("Saved on this device. Sync event to cloud for TV playback.");
      } else {
        setUploadMessage(remote.error ?? "File too large. Use a track under 4.5 MB.");
        return;
      }

      patchMusic({
        trackUrl,
        trackName,
        bpm: detectedBpm,
        enabled: true,
        syncToBeat: music.syncToBeat ?? false,
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
    <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-4">
      <div className="flex items-center gap-2">
        <Music className="w-5 h-5 text-champagne" />
        <h3 className="font-medium text-lg">Slideshow Music</h3>
      </div>

      {!compact && (
        <p className="text-sm text-warm-gray">
          Add a wedding song for fullscreen slideshow and reception TV mode. Turn on beat sync so
          photos change on the rhythm.
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.ogg"
        className="hidden"
        onChange={handleMusicUpload}
      />

      {music.trackUrl ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-blush/40 border border-champagne/10">
          <AudioLines className="w-5 h-5 text-champagne shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{music.trackName ?? "Uploaded track"}</p>
            {music.bpm && (
              <p className="text-xs text-warm-gray">Tempo: {music.bpm} BPM</p>
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
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-champagne/40 bg-blush/30 hover:bg-blush/50 hover:border-champagne transition-colors disabled:opacity-50"
        >
          <div className="p-3 rounded-full bg-champagne/15 text-champagne">
            <Upload className="w-6 h-6" />
          </div>
          <div className="text-center">
            <p className="font-medium text-charcoal">
              {uploading ? "Adding music…" : "Add Music"}
            </p>
            <p className="text-xs text-warm-gray mt-1">MP3, M4A, or WAV · max 4.5 MB</p>
          </div>
        </button>
      )}

      {music.trackUrl && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4" />
          Replace Music
        </Button>
      )}

      {uploadMessage && (
        <p className="text-xs text-warm-gray bg-blush/30 rounded-lg px-3 py-2">{uploadMessage}</p>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={music.enabled}
          onChange={(e) => patchMusic({ enabled: e.target.checked })}
        />
        Play music during slideshow
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={music.syncToBeat ?? false}
          disabled={!music.trackUrl}
          onChange={(e) => patchMusic({ syncToBeat: e.target.checked })}
        />
        Sync photo transitions to the beat
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={music.loop}
          onChange={(e) => patchMusic({ loop: e.target.checked })}
        />
        Loop music
      </label>

      <Input
        label="Track name (shown on slideshow)"
        defaultValue={music.trackName ?? ""}
        placeholder="Our Song"
        onBlur={(e) => patchMusic({ trackName: e.target.value || undefined })}
      />

      <Input
        label="BPM (tempo)"
        type="number"
        min={60}
        max={180}
        defaultValue={music.bpm ?? 120}
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
                (music.beatsPerSlide ?? 4) === opt.value
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
          Volume ({Math.round((music.volume ?? 0.75) * 100)}%)
        </p>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round((music.volume ?? 0.75) * 100)}
          onChange={(e) => patchMusic({ volume: Number(e.target.value) / 100 })}
          className="w-full accent-champagne"
        />
      </div>
    </section>
  );
}
