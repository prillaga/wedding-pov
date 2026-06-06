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
import { RotateCcw } from "lucide-react";
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

        <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-3">
          <h3 className="font-medium">Welcome Screen Hero</h3>
          <p className="text-sm text-warm-gray">
            Couple photos, layouts, invitation styles, text colors, and overlays are managed in the{" "}
            <strong>Hero Banner</strong> admin tab for a full live preview.
          </p>
          <Select
            label="Background Mode (app-wide fallback)"
            options={[
              { value: "photo", label: "Couple Photo" },
              { value: "blur", label: "Blur Background" },
              { value: "dark-overlay", label: "Color Overlay" },
              { value: "light-overlay", label: "Light Overlay" },
              { value: "slideshow", label: "Background Slideshow" },
            ]}
            value={draft.backgroundMode}
            onChange={(e) =>
              persist({ backgroundMode: e.target.value as BackgroundMode })
            }
          />
        </section>

        <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-3">
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
