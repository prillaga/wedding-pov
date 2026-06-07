"use client";

import { useCallback, useEffect, useRef } from "react";
import { beatIntervalMs } from "@/lib/audio-bpm";
import type { SlideshowMusicSettings } from "@/types";

interface UseSlideshowMusicOptions {
  music?: SlideshowMusicSettings;
  musicOn: boolean;
  playing: boolean;
  phase: "intro" | "slides" | "outro";
  onBeatAdvance: () => void;
}

export function useSlideshowMusic({
  music,
  musicOn,
  playing,
  phase,
  onBeatAdvance,
}: UseSlideshowMusicOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSlideBeatRef = useRef(-1);
  const onBeatAdvanceRef = useRef(onBeatAdvance);

  onBeatAdvanceRef.current = onBeatAdvance;

  const hasTrack = Boolean(music?.trackUrl);
  const beatSyncActive = Boolean(
    music?.enabled &&
      musicOn &&
      music.syncToBeat &&
      music.bpm &&
      phase === "slides"
  );

  const beatSlideMs = beatIntervalMs(music?.bpm ?? 120, music?.beatsPerSlide ?? 4);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !music?.trackUrl) return;

    if (audio.src !== music.trackUrl) {
      audio.src = music.trackUrl;
      audio.load();
      lastSlideBeatRef.current = -1;
    }

    audio.loop = music.loop ?? true;
    audio.volume = music.volume ?? 0.75;

    const shouldPlay = playing && musicOn && music.enabled && phase === "slides";

    if (shouldPlay) {
      void audio.play().catch(() => undefined);
    } else if (!audio.paused) {
      audio.pause();
    }
  }, [music, musicOn, playing, phase]);

  useEffect(() => {
    if (!beatSyncActive || !hasTrack) return;

    const audio = audioRef.current;
    if (!audio) return;

    const bpm = music!.bpm!;
    const beatsPerSlide = music!.beatsPerSlide ?? 4;
    const beatDuration = 60 / bpm;

    const handleTimeUpdate = () => {
      const beatIndex = Math.floor(audio.currentTime / beatDuration);
      const slideBeat = Math.floor(beatIndex / beatsPerSlide);

      if (slideBeat !== lastSlideBeatRef.current && lastSlideBeatRef.current >= 0) {
        onBeatAdvanceRef.current();
      }

      lastSlideBeatRef.current = slideBeat;
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, [beatSyncActive, hasTrack, music]);

  useEffect(() => {
    if (phase !== "slides") {
      lastSlideBeatRef.current = -1;
    }
  }, [phase]);

  const fadeOut = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !music?.autoFade) {
      audio?.pause();
      return;
    }

    const startVolume = audio.volume;
    const steps = 12;
    for (let i = steps; i >= 0; i -= 1) {
      audio.volume = (startVolume * i) / steps;
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    audio.pause();
    audio.volume = music.volume ?? 0.75;
  }, [music]);

  return {
    audioRef,
    beatSyncActive,
    beatSlideMs,
    hasTrack,
    fadeOut,
  };
}
