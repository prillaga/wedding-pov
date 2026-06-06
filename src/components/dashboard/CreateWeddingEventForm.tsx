"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { EventQRCode } from "@/components/qr/EventQRCode";
import { PHOTO_LIMIT_OPTIONS, THEME_PRESETS } from "@/lib/constants";
import { generateDefaultHashtag } from "@/lib/event-utils";
import { pushRemoteEvent } from "@/lib/event-remote";
import { createWeddingEvent } from "@/lib/store";
import type { PhotoLimitValue, ThemePreset } from "@/types";
import { Calendar, Heart, ImagePlus, Sparkles } from "lucide-react";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CreateWeddingEventForm() {
  const router = useRouter();
  const [brideName, setBrideName] = useState("");
  const [groomName, setGroomName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [venue, setVenue] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [maxPhotos, setMaxPhotos] = useState<PhotoLimitValue>(25);
  const [themePreset, setThemePreset] = useState<ThemePreset>("champagne");
  const [couplePhoto, setCouplePhoto] = useState<string | undefined>();
  const [creating, setCreating] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<ReturnType<typeof createWeddingEvent> | null>(
    null
  );
  const [syncWarning, setSyncWarning] = useState("");

  const previewHashtag =
    hashtag ||
    (groomName && brideName && weddingDate
      ? generateDefaultHashtag({ groomName, brideName, weddingDate })
      : "");

  const handleCreate = () => {
    if (!brideName.trim() || !groomName.trim() || !weddingDate || !venue.trim()) return;
    setCreating(true);
    setSyncWarning("");
    try {
      const event = createWeddingEvent({
        brideName,
        groomName,
        weddingDate,
        venue,
        hashtag: previewHashtag,
        welcomeMessage,
        maxPhotos,
        themePreset,
        couplePhoto,
      });
      setCreatedEvent(event);
      void pushRemoteEvent(event).then((result) => {
        if (!result.ok) {
          setSyncWarning(
            result.error ??
              "Event saved on this device only. Open Admin Dashboard and tap Sync Now after connecting Vercel Blob storage."
          );
        }
      });
    } finally {
      setCreating(false);
    }
  };

  if (createdEvent) {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-center">
          <Sparkles className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h2 className="font-serif text-xl font-semibold text-green-900">Event Created!</h2>
          <p className="text-sm text-green-800 mt-1">
            Your wedding is ready. Share the QR code with guests — they scan, join, and start taking
            photos immediately. Re-download the QR after any changes so every guest phone can find
            the event.
          </p>
          {syncWarning && (
            <p className="text-sm text-amber-800 mt-3 px-3 py-2 rounded-lg bg-amber-100 text-left">
              {syncWarning}
            </p>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-white wedding-shadow border border-champagne/10">
          <EventQRCode
            eventId={createdEvent.id}
            coupleName={createdEvent.coupleName}
            size={220}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="gold"
            className="flex-1"
            onClick={() => router.push(`/dashboard/${createdEvent.id}`)}
          >
            Open Event Dashboard
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => router.push(`/wedding/${createdEvent.id}`)}
          >
            Preview Guest Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blush to-white border border-champagne/15">
        <h2 className="font-serif text-xl font-semibold flex items-center gap-2">
          <Heart className="w-5 h-5 text-champagne" />
          Create Wedding Event
        </h2>
        <p className="text-sm text-warm-gray mt-1">
          Set up once — the system generates your event link and QR code automatically.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Bride Name *"
          value={brideName}
          onChange={(e) => setBrideName(e.target.value)}
          placeholder="Jane"
        />
        <Input
          label="Groom Name *"
          value={groomName}
          onChange={(e) => setGroomName(e.target.value)}
          placeholder="John"
        />
        <Input
          label="Wedding Date *"
          type="date"
          value={weddingDate}
          onChange={(e) => setWeddingDate(e.target.value)}
        />
        <Input
          label="Venue *"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="The Garden Pavilion"
        />
        <Input
          label="Wedding Hashtag"
          value={hashtag}
          onChange={(e) => setHashtag(e.target.value)}
          placeholder={previewHashtag || "#JohnAndJane2027"}
        />
        <Select
          label="Upload Limit Per Guest"
          value={String(maxPhotos)}
          onChange={(e) => setMaxPhotos(Number(e.target.value) as PhotoLimitValue)}
          options={PHOTO_LIMIT_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-2">Theme Preset</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setThemePreset(preset)}
              className={`p-3 rounded-xl border text-left text-xs transition-all ${
                themePreset === preset ? "border-champagne bg-blush" : "border-champagne/20"
              }`}
            >
              <div className="flex gap-1 mb-2">
                {[THEME_PRESETS[preset].colors.primary, THEME_PRESETS[preset].colors.accent].map(
                  (c) => (
                    <div
                      key={c}
                      className="w-4 h-4 rounded-full border border-black/10"
                      style={{ background: c }}
                    />
                  )
                )}
              </div>
              {THEME_PRESETS[preset].label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-champagne/30 px-4 py-3 text-sm text-warm-gray hover:bg-blush/30">
        <ImagePlus className="h-4 w-4 text-champagne" />
        Upload couple photo (hero background)
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setCouplePhoto(await readFileAsDataUrl(file));
          }}
        />
      </label>
      {couplePhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={couplePhoto} alt="Couple preview" className="h-24 w-24 rounded-xl object-cover border border-champagne/20" />
      )}

      <Textarea
        label="Welcome Message (optional)"
        value={welcomeMessage}
        onChange={(e) => setWelcomeMessage(e.target.value)}
        rows={2}
        placeholder="We're so glad you're here!"
      />

      <Button
        variant="gold"
        size="lg"
        className="w-full"
        loading={creating}
        disabled={!brideName.trim() || !groomName.trim() || !weddingDate || !venue.trim()}
        onClick={handleCreate}
      >
        <Calendar className="w-5 h-5" />
        Create Event
      </Button>
    </div>
  );
}
