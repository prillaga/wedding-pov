"use client";

import { TAGLINE } from "@/lib/constants";
import { formatGuestNamePOV } from "@/lib/utils";
import type { EventSettings, ThemeSettings } from "@/types";

interface LiveThemePreviewProps {
  theme: ThemeSettings;
  settings: EventSettings;
  previewScreen?: "homepage" | "camera" | "gallery";
}

export function LiveThemePreview({
  theme,
  settings,
  previewScreen = "homepage",
}: LiveThemePreviewProps) {
  const { colors, screenBackgrounds, hero } = theme;
  const coupleLabel = `${settings.groomName} & ${settings.brideName}`;

  const heroImage =
    hero.couplePhoto ??
    theme.backgroundImage ??
    hero.backgroundImages[0];

  const bgForScreen = {
    homepage: screenBackgrounds.homepage,
    camera: screenBackgrounds.camera,
    gallery: screenBackgrounds.gallery,
  }[previewScreen];

  const overlayStyle = hero.useGradientOverlay
    ? {
        background: `linear-gradient(${hero.overlayGradient.angle}deg, ${hero.overlayGradient.from}, ${hero.overlayGradient.to})`,
        opacity: hero.overlayOpacity,
      }
    : {
        background: hero.overlayColor,
        opacity: hero.overlayOpacity,
      };

  return (
    <div className="sticky top-4">
      <p className="text-xs font-medium text-warm-gray mb-2 uppercase tracking-wider">Live Preview</p>
      <div
        className="mx-auto w-full max-w-[220px] rounded-[2rem] border-4 border-charcoal/80 overflow-hidden shadow-2xl"
        style={{ background: screenBackgrounds.app }}
      >
        <div className="h-6 bg-charcoal flex items-center justify-center">
          <div className="w-16 h-1 rounded-full bg-white/20" />
        </div>

        {previewScreen === "homepage" && (
          <div className="relative h-[360px] overflow-hidden" style={{ background: bgForScreen }}>
            {heroImage && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${heroImage})`,
                  backgroundSize: `${hero.imageZoom}%`,
                  backgroundPosition: `${hero.imagePosition.x}% ${hero.imagePosition.y}%`,
                  filter: theme.backgroundMode === "blur" ? `blur(${hero.blurAmount || 8}px)` : undefined,
                }}
              />
            )}
            <div className="absolute inset-0" style={overlayStyle} />
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center text-white">
              <p className="text-[8px] tracking-widest uppercase mb-2" style={{ color: colors.accent }}>
                {settings.hashtag}
              </p>
              <p
                className="text-lg font-serif font-semibold leading-tight"
                style={{ fontFamily: "var(--event-heading-font, Georgia, serif)" }}
              >
                {coupleLabel}
              </p>
              <p className="text-[9px] opacity-75 mt-1">{settings.weddingDate}</p>
              <p className="text-[8px] opacity-70 mt-3 leading-snug">{TAGLINE}</p>
              <div
                className="mt-4 px-4 py-1.5 rounded-full text-[9px] font-medium text-white"
                style={{ background: colors.button }}
              >
                Join Event
              </div>
            </div>
          </div>
        )}

        {previewScreen === "camera" && (
          <div className="relative h-[360px] flex flex-col" style={{ background: bgForScreen }}>
            <div
              className="px-3 py-2 text-[9px] font-medium"
              style={{ background: colors.header, color: colors.text }}
            >
              Camera
            </div>
            <div className="flex-1 bg-black/80 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-white/30" />
            </div>
            <div className="p-3 space-y-1.5">
              <p className="text-[9px] text-white font-medium">John Doe</p>
              <div className="h-1 rounded-full bg-white/15 overflow-hidden">
                <div className="h-full w-[80%] rounded-full" style={{ background: colors.progressBar }} />
              </div>
              <p className="text-[8px] text-white/60">8 / 10 Photos Used · Remaining: 2</p>
            </div>
            <div
              className="flex justify-around py-2 text-[8px]"
              style={{ background: colors.footer, color: colors.navigation }}
            >
              <span>Home</span>
              <span>Camera</span>
              <span>Gallery</span>
            </div>
          </div>
        )}

        {previewScreen === "gallery" && (
          <div className="h-[360px] flex flex-col" style={{ background: bgForScreen }}>
            <div
              className="px-3 py-2 text-[9px] font-medium border-b border-black/5"
              style={{ color: colors.header }}
            >
              POV Gallery
            </div>
            <div className="p-2 space-y-2 flex-1 overflow-hidden">
              {["John Doe", "Maria Santos"].map((name, i) => (
                <div
                  key={name}
                  className="p-2 rounded-lg border border-black/5"
                  style={{ background: colors.primary }}
                >
                  <div className="flex justify-between text-[8px]" style={{ color: colors.text }}>
                    <span>{formatGuestNamePOV(name)}</span>
                    <span style={{ color: colors.accent }}>{i === 0 ? "8 / 10" : "10 / 10"}</span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-black/5">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: i === 0 ? "80%" : "100%",
                        background: colors.progressBar,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
