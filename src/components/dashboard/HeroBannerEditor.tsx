"use client";

import { useCallback, useState } from "react";
import {
  ImagePlus,
  Layout,
  Palette,
  RotateCw,
  Sparkles,
  Type,
  Upload,
  Video,
} from "lucide-react";
import { HeroBannerRenderer } from "@/components/hero/HeroBannerRenderer";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_HERO,
  DEFAULT_HERO_TEXT_COLORS,
  HERO_INVITATION_STYLES,
  HERO_LAYOUT_OPTIONS,
} from "@/lib/constants";
import { updateTheme } from "@/lib/store";
import type { HeroSettings, HeroTextColors, ThemeSettings, WeddingEvent } from "@/types";

interface HeroBannerEditorProps {
  event: WeddingEvent;
  onRefresh: () => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function HeroBannerEditor({ event, onRefresh }: HeroBannerEditorProps) {
  const [draft, setDraft] = useState<ThemeSettings>(event.theme);

  const patchHero = useCallback(
    (patch: Partial<HeroSettings>) => {
      const nextHero = { ...draft.hero, ...patch };
      const next = { ...draft, hero: nextHero };
      setDraft(next);
      updateTheme(event.id, { hero: patch });
      onRefresh();
    },
    [draft, event.id, onRefresh]
  );

  const patchTextColors = (patch: Partial<HeroTextColors>) => {
    patchHero({ textColors: { ...draft.hero.textColors, ...patch } });
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "couplePhoto" | "backgroundImages" | "videoBackgroundUrl"
  ) => {
    const files = e.target.files;
    if (!files?.length) return;
    const url = await readFileAsDataUrl(files[0]);
    if (field === "backgroundImages") {
      patchHero({ backgroundImages: [...draft.hero.backgroundImages, url] });
    } else if (field === "couplePhoto") {
      patchHero({ couplePhoto: url });
      updateTheme(event.id, { backgroundImage: url });
      setDraft((d) => ({ ...d, backgroundImage: url, hero: { ...d.hero, couplePhoto: url } }));
    } else {
      patchHero({ videoBackgroundUrl: url, layout: "video-background" });
    }
    e.target.value = "";
  };

  const previewEvent: WeddingEvent = { ...event, theme: draft };
  const hero = draft.hero;

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-charcoal to-black border border-champagne/20 text-white">
        <h2 className="font-serif text-xl font-semibold text-champagne">Hero Banner Editor</h2>
        <p className="mt-1 text-sm text-white/60">
          Customize the welcome screen — couple photos, overlays, typography, and layout. Changes
          preview live.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-champagne/10 bg-white wedding-shadow">
        <div className="border-b border-champagne/10 px-4 py-2 text-xs font-medium uppercase tracking-wider text-champagne">
          Live Preview
        </div>
        <div className="relative h-[420px] md:h-[520px] overflow-hidden bg-charcoal">
          <HeroBannerRenderer event={previewEvent} preview showJoinButton onJoinClick={() => {}} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-4">
          <h3 className="flex items-center gap-2 font-medium">
            <ImagePlus className="h-5 w-5 text-champagne" />
            Background Images
          </h3>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-champagne/30 px-4 py-3 text-sm text-warm-gray hover:border-champagne/50">
            <Upload className="h-4 w-4" />
            Upload couple photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e, "couplePhoto")}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-champagne/30 px-4 py-3 text-sm text-warm-gray hover:border-champagne/50">
            <Upload className="h-4 w-4" />
            Add background / engagement photo
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e, "backgroundImages")}
            />
          </label>
          {hero.backgroundImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {hero.backgroundImages.map((url, i) => (
                <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-champagne/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute inset-0 bg-black/50 text-xs text-white opacity-0 hover:opacity-100"
                    onClick={() =>
                      patchHero({
                        backgroundImages: hero.backgroundImages.filter((_, j) => j !== i),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hero.backgroundSlideshow}
              onChange={(e) => patchHero({ backgroundSlideshow: e.target.checked })}
            />
            Slideshow mode (multiple backgrounds)
          </label>
        </section>

        <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-3">
          <h3 className="flex items-center gap-2 font-medium">
            <Layout className="h-5 w-5 text-champagne" />
            Hero Layout
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {HERO_LAYOUT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  patchHero({
                    layout: opt.value,
                    backgroundSlideshow: opt.value === "slideshow" ? true : hero.backgroundSlideshow,
                  })
                }
                className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                  hero.layout === opt.value
                    ? "border-champagne bg-blush text-charcoal"
                    : "border-champagne/20 text-warm-gray hover:border-champagne/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {hero.layout === "video-background" && (
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-champagne/30 px-4 py-3 text-sm">
              <Video className="h-4 w-4" />
              Upload video (MP4)
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, "videoBackgroundUrl")}
              />
            </label>
          )}
        </section>

        <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-4">
          <h3 className="flex items-center gap-2 font-medium">
            <RotateCw className="h-5 w-5 text-champagne" />
            Image Controls
          </h3>
          {(
            [
              ["Position X", "x", 0, 100, hero.imagePosition.x],
              ["Position Y", "y", 0, 100, hero.imagePosition.y],
            ] as const
          ).map(([label, axis, min, max, val]) => (
            <div key={axis}>
              <label className="text-sm text-warm-gray">
                {label}: {val}%
              </label>
              <input
                type="range"
                min={min}
                max={max}
                value={val}
                onChange={(e) =>
                  patchHero({
                    imagePosition: { ...hero.imagePosition, [axis]: Number(e.target.value) },
                  })
                }
                className="w-full accent-champagne"
              />
            </div>
          ))}
          {(
            [
              ["Zoom", "imageZoom", 100, 200, hero.imageZoom],
              ["Rotation", "imageRotation", -15, 15, hero.imageRotation],
              ["Blur", "blurAmount", 0, 20, hero.blurAmount],
              ["Brightness", "brightness", 50, 150, hero.brightness],
            ] as const
          ).map(([label, key, min, max, val]) => (
            <div key={key}>
              <label className="text-sm text-warm-gray">
                {label}: {val}
                {key === "imageRotation" ? "°" : key === "blurAmount" ? "px" : key === "brightness" ? "%" : "%"}
              </label>
              <input
                type="range"
                min={min}
                max={max}
                value={val}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  patchHero({ [key]: num });
                  if (key === "blurAmount" && num > 0) {
                    updateTheme(event.id, { backgroundMode: "blur" });
                  }
                }}
                className="w-full accent-champagne"
              />
            </div>
          ))}
        </section>

        <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-4">
          <h3 className="flex items-center gap-2 font-medium">
            <Palette className="h-5 w-5 text-champagne" />
            Overlays
          </h3>
          <div>
            <label className="text-sm text-warm-gray">
              Overlay opacity: {Math.round(hero.overlayOpacity * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={hero.overlayOpacity * 100}
              onChange={(e) => patchHero({ overlayOpacity: Number(e.target.value) / 100 })}
              className="w-full accent-champagne"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hero.lightOverlay}
              onChange={(e) => patchHero({ lightOverlay: e.target.checked, useGradientOverlay: false })}
            />
            Light overlay
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hero.useGradientOverlay}
              onChange={(e) => patchHero({ useGradientOverlay: e.target.checked, lightOverlay: false })}
            />
            Gradient overlay
          </label>
          {!hero.useGradientOverlay && !hero.lightOverlay && (
            <div>
              <label className="text-sm text-warm-gray">Dark overlay color</label>
              <input
                type="color"
                value={hero.overlayColor.startsWith("#") ? hero.overlayColor : "#000000"}
                onChange={(e) => patchHero({ overlayColor: e.target.value })}
                className="mt-1 h-10 w-full cursor-pointer rounded-lg"
              />
            </div>
          )}
        </section>

        <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-4">
          <h3 className="flex items-center gap-2 font-medium">
            <Type className="h-5 w-5 text-champagne" />
            Text & Readability
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["title", "Couple names"],
                ["hashtag", "Hashtag"],
                ["date", "Date & venue"],
                ["tagline", "Tagline"],
                ["button", "Button"],
                ["buttonText", "Button text"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="text-xs text-warm-gray">{label}</label>
                <input
                  type="color"
                  value={hero.textColors[key]}
                  onChange={(e) => patchTextColors({ [key]: e.target.value })}
                  className="mt-1 h-9 w-full cursor-pointer rounded-lg"
                />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hero.textShadow}
              onChange={(e) => patchHero({ textShadow: e.target.checked })}
            />
            Text shadow
          </label>
          <div>
            <label className="text-sm text-warm-gray">Blur behind text: {hero.textBackdropBlur}px</label>
            <input
              type="range"
              min={0}
              max={24}
              value={hero.textBackdropBlur}
              onChange={(e) => patchHero({ textBackdropBlur: Number(e.target.value) })}
              className="w-full accent-champagne"
            />
          </div>
        </section>

        <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-3">
          <h3 className="flex items-center gap-2 font-medium">
            <Sparkles className="h-5 w-5 text-champagne" />
            Wedding Invitation Mode
          </h3>
          <div className="grid gap-2">
            {HERO_INVITATION_STYLES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => patchHero({ invitationStyle: opt.value })}
                className={`rounded-xl border px-4 py-2 text-left text-sm transition ${
                  hero.invitationStyle === opt.value
                    ? "border-champagne bg-blush text-charcoal"
                    : "border-champagne/20 text-warm-gray hover:border-champagne/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              patchHero({ ...DEFAULT_HERO, textColors: { ...DEFAULT_HERO_TEXT_COLORS } });
              setDraft((d) => ({
                ...d,
                hero: { ...DEFAULT_HERO, textColors: { ...DEFAULT_HERO_TEXT_COLORS } },
              }));
            }}
          >
            Reset hero to defaults
          </Button>
        </section>
      </div>
    </div>
  );
}
