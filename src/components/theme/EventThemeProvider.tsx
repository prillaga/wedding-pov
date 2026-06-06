"use client";

import { useEffect } from "react";
import type { ThemeSettings, WeddingEvent } from "@/types";
import { TYPOGRAPHY_OPTIONS } from "@/lib/constants";

export function applyEventTheme(theme: ThemeSettings): void {
  const root = document.documentElement;
  const { colors, typography } = theme;
  const typo = TYPOGRAPHY_OPTIONS.find((t) => t.value === typography);

  root.style.setProperty("--event-primary", colors.primary);
  root.style.setProperty("--event-secondary", colors.secondary);
  root.style.setProperty("--event-accent", colors.accent);
  root.style.setProperty("--event-text", colors.text);
  root.style.setProperty("--event-button", colors.button);
  root.style.setProperty("--event-header", colors.header);
  root.style.setProperty("--event-footer", colors.footer);
  root.style.setProperty("--event-progress", colors.progressBar);
  root.style.setProperty("--event-nav", colors.navigation);

  if (theme.screenBackgrounds) {
    root.style.setProperty("--bg-app", theme.screenBackgrounds.app);
    root.style.setProperty("--bg-homepage", theme.screenBackgrounds.homepage);
    root.style.setProperty("--bg-gallery", theme.screenBackgrounds.gallery);
    root.style.setProperty("--bg-slideshow", theme.screenBackgrounds.slideshow);
    root.style.setProperty("--bg-login", theme.screenBackgrounds.login);
    root.style.setProperty("--bg-camera", theme.screenBackgrounds.camera);
    root.style.setProperty("--bg-display", theme.screenBackgrounds.display);
  }
  root.style.setProperty("--event-heading-font", typo?.heading ?? "Georgia, serif");
  root.style.setProperty("--event-body-font", typo?.body ?? "system-ui, sans-serif");
}

export function EventThemeProvider({
  event,
  children,
}: {
  event: WeddingEvent | undefined;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (event?.theme) applyEventTheme(event.theme);
  }, [event?.theme]);

  if (!event) return <>{children}</>;

  const { theme } = event;
  const bgStyle: React.CSSProperties = {};

  if (theme.backgroundImage) {
    bgStyle.backgroundImage = `url(${theme.backgroundImage})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  }

  const overlay =
    theme.backgroundMode === "dark-overlay"
      ? "rgba(0,0,0,0.45)"
      : theme.backgroundMode === "blur"
        ? undefined
        : undefined;

  return (
    <div
      className="min-h-dvh"
      style={{
        ...bgStyle,
        backgroundColor: theme.colors.primary,
        color: theme.colors.text,
        fontFamily: "var(--event-body-font, var(--font-outfit))",
      }}
    >
      {theme.backgroundImage && overlay && (
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{ background: overlay }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
