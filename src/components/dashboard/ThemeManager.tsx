"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import {
  COLOR_LABELS,
  SCREEN_LABELS,
  THEME_PRESETS,
  TYPOGRAPHY_OPTIONS,
} from "@/lib/constants";
import { updateTheme } from "@/lib/store";
import type { BackgroundMode, ThemePreset, ThemeSettings, ThemeSettingsPatch, WeddingEvent } from "@/types";
import { ImagePlus, RotateCcw } from "lucide-react";
import { LiveThemePreview } from "./LiveThemePreview";

interface ThemeManagerProps {
  event: WeddingEvent;
  onRefresh: () => void;
}

type PreviewScreen = "homepage" | "camera" | "gallery";

export function ThemeManager({ event, onRefresh }: ThemeManagerProps) {
  const [draft, setDraft] = useState<ThemeSettings>(event.theme);
  const [previewScreen, setPreviewScreen] = useState<PreviewScreen>("homepage");

  const persist = useCallback(
    (patch: ThemeSettingsPatch) => {
      const next = {
        ...draft,
        ...patch,
        colors: patch.colors ? { ...draft.colors, ...patch.colors } : draft.colors,
        screenBackgrounds: patch.screenBackgrounds
          ? { ...draft.screenBackgrounds, ...patch.screenBackgrounds }
          : draft.screenBackgrounds,
        hero: patch.hero ? { ...draft.hero, ...patch.hero } : draft.hero,
      };
      setDraft(next);
      updateTheme(event.id, patch);
      onRefresh();
    },
    [draft, event.id, onRefresh]
  );

  const readFile = (file: File, cb: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => cb(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_240px] gap-6">
      <div className="space-y-6">
        <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10">
          <h3 className="font-medium mb-3">Theme Presets</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() =>
                  persist({ preset, colors: THEME_PRESETS[preset].colors })
                }
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  draft.preset === preset ? "border-champagne bg-blush" : "border-champagne/20"
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
        </section>

        <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-3">
          <h3 className="font-medium">Color Settings</h3>
          {COLOR_LABELS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <label className="text-sm text-warm-gray">{label}</label>
              <input
                type="color"
                value={draft.colors[key]}
                onChange={(e) => {
                  persist({
                    preset: "custom",
                    colors: { ...draft.colors, [key]: e.target.value },
                  });
                }}
                className="w-10 h-10 rounded-lg cursor-pointer border border-champagne/20"
              />
            </div>
          ))}
        </section>

        <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-3">
          <h3 className="font-medium">Screen Backgrounds</h3>
          {SCREEN_LABELS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <label className="text-sm text-warm-gray flex-1">{label}</label>
              <input
                type="color"
                value={draft.screenBackgrounds[key]}
                onChange={(e) =>
                  persist({
                    screenBackgrounds: { ...draft.screenBackgrounds, [key]: e.target.value },
                  })
                }
                className="w-10 h-10 rounded-lg cursor-pointer border border-champagne/20"
              />
            </div>
          ))}
        </section>

        <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-4">
          <h3 className="font-medium">Couple Hero Section</h3>

          <div>
            <label className="block text-sm text-warm-gray mb-1.5">Couple Photo</label>
            <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-champagne/30 cursor-pointer text-sm text-warm-gray hover:bg-blush/30">
              <ImagePlus className="w-4 h-4" />
              Upload couple photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  readFile(file, (dataUrl) => {
                    persist({
                      backgroundImage: dataUrl,
                      hero: { couplePhoto: dataUrl },
                    });
                  });
                }}
              />
            </label>
          </div>

          <div>
            <label className="block text-sm text-warm-gray mb-1.5">Background Images (slideshow)</label>
            <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-champagne/30 cursor-pointer text-sm text-warm-gray hover:bg-blush/30">
              <ImagePlus className="w-4 h-4" />
              Add background images
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (!files.length) return;
                  Promise.all(
                    files.map(
                      (file) =>
                        new Promise<string>((resolve) => readFile(file, resolve))
                    )
                  ).then((images) => {
                    persist({
                      hero: {
                        backgroundImages: [...draft.hero.backgroundImages, ...images],
                        backgroundSlideshow: true,
                      },
                      backgroundMode: "slideshow",
                    });
                  });
                }}
              />
            </label>
            {draft.hero.backgroundImages.length > 0 && (
              <p className="text-xs text-warm-gray mt-1">
                {draft.hero.backgroundImages.length} background image(s)
              </p>
            )}
          </div>

          <Select
            label="Background Mode"
            options={[
              { value: "photo", label: "Couple Photo" },
              { value: "blur", label: "Blur Background" },
              { value: "dark-overlay", label: "Color Overlay" },
              { value: "slideshow", label: "Background Slideshow" },
            ]}
            value={draft.backgroundMode}
            onChange={(e) =>
              persist({ backgroundMode: e.target.value as BackgroundMode })
            }
          />

          <div>
            <label className="text-sm text-warm-gray">
              Reposition — X: {draft.hero.imagePosition.x}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={draft.hero.imagePosition.x}
              onChange={(e) =>
                persist({
                  hero: {
                    imagePosition: { ...draft.hero.imagePosition, x: Number(e.target.value) },
                  },
                })
              }
              className="w-full accent-champagne"
            />
            <label className="text-sm text-warm-gray">
              Reposition — Y: {draft.hero.imagePosition.y}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={draft.hero.imagePosition.y}
              onChange={(e) =>
                persist({
                  hero: {
                    imagePosition: { ...draft.hero.imagePosition, y: Number(e.target.value) },
                  },
                })
              }
              className="w-full accent-champagne"
            />
          </div>

          <div>
            <label className="text-sm text-warm-gray">Zoom: {draft.hero.imageZoom}%</label>
            <input
              type="range"
              min={80}
              max={200}
              value={draft.hero.imageZoom}
              onChange={(e) => persist({ hero: { imageZoom: Number(e.target.value) } })}
              className="w-full accent-champagne"
            />
          </div>

          <div>
            <label className="text-sm text-warm-gray">Blur: {draft.hero.blurAmount}px</label>
            <input
              type="range"
              min={0}
              max={20}
              value={draft.hero.blurAmount}
              onChange={(e) => persist({ hero: { blurAmount: Number(e.target.value) } })}
              className="w-full accent-champagne"
            />
          </div>

          <div>
            <label className="text-sm text-warm-gray">
              Overlay Opacity: {Math.round(draft.hero.overlayOpacity * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(draft.hero.overlayOpacity * 100)}
              onChange={(e) =>
                persist({ hero: { overlayOpacity: Number(e.target.value) / 100 } })
              }
              className="w-full accent-champagne"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.hero.useGradientOverlay}
              onChange={(e) => persist({ hero: { useGradientOverlay: e.target.checked } })}
            />
            Gradient overlay
          </label>

          {draft.hero.useGradientOverlay ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-warm-gray">Gradient From</label>
                <input
                  type="color"
                  value={draft.hero.overlayGradient.from}
                  onChange={(e) =>
                    persist({
                      hero: {
                        overlayGradient: { ...draft.hero.overlayGradient, from: e.target.value },
                      },
                    })
                  }
                  className="w-full h-10 rounded-lg cursor-pointer mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-warm-gray">Gradient To</label>
                <input
                  type="color"
                  value={draft.hero.overlayGradient.to}
                  onChange={(e) =>
                    persist({
                      hero: {
                        overlayGradient: { ...draft.hero.overlayGradient, to: e.target.value },
                      },
                    })
                  }
                  className="w-full h-10 rounded-lg cursor-pointer mt-1"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <label className="text-sm text-warm-gray">Overlay Color</label>
              <input
                type="color"
                value={draft.hero.overlayColor}
                onChange={(e) => persist({ hero: { overlayColor: e.target.value } })}
                className="w-10 h-10 rounded-lg cursor-pointer"
              />
            </div>
          )}

          <Select
            label="Typography"
            options={TYPOGRAPHY_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
            value={draft.typography}
            onChange={(e) =>
              persist({ typography: e.target.value as ThemeSettings["typography"] })
            }
          />
        </section>
      </div>

      <div className="space-y-4">
        <div className="flex gap-1 p-1 rounded-full bg-blush/50">
          {(["homepage", "camera", "gallery"] as PreviewScreen[]).map((screen) => (
            <button
              key={screen}
              type="button"
              onClick={() => setPreviewScreen(screen)}
              className={`flex-1 py-1.5 rounded-full text-[10px] font-medium capitalize transition-all ${
                previewScreen === screen ? "bg-white shadow text-charcoal" : "text-warm-gray"
              }`}
            >
              {screen}
            </button>
          ))}
        </div>
        <LiveThemePreview
          theme={draft}
          settings={event.settings}
          previewScreen={previewScreen}
        />
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => {
            setDraft(event.theme);
          }}
        >
          <RotateCcw className="w-4 h-4" /> Reset Preview
        </Button>
      </div>
    </div>
  );
}
