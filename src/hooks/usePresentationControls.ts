"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UsePresentationControlsOptions {
  autoHideMs?: number;
}

export function usePresentationControls(options: UsePresentationControlsOptions = {}) {
  const { autoHideMs = 3000 } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [controlsVisible, setControlsVisible] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, autoHideMs);
  }, [autoHideMs, clearHideTimer]);

  const requestContainerFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;

    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if ("webkitRequestFullscreen" in el) {
        await (el as HTMLElement & { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
      }
    } catch {
      // Fullscreen may be blocked; presentation still works edge-to-edge
    }
  }, []);

  const startPresentation = useCallback(async () => {
    setHasStarted(true);
    await requestContainerFullscreen();
    showControls();
  }, [requestContainerFullscreen, showControls]);

  const handleInteraction = useCallback(() => {
    if (!hasStarted) return;
    showControls();
  }, [hasStarted, showControls]);

  const exitFullscreen = useCallback(async () => {
    clearHideTimer();
    setControlsVisible(false);
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  }, [clearHideTimer]);

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      clearHideTimer();
    };
  }, [clearHideTimer]);

  return {
    containerRef,
    controlsVisible,
    hasStarted,
    isFullscreen,
    startPresentation,
    handleInteraction,
    showControls,
    exitFullscreen,
  };
}
