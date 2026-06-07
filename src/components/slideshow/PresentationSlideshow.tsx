"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { LiveSlideshow } from "@/components/slideshow/LiveSlideshow";
import { filterSlideshowPhotos } from "@/lib/slideshow-photos";
import { countUniqueGuests } from "@/lib/highlight-reel";
import { usePresentationControls } from "@/hooks/usePresentationControls";
import type { SlideshowIntroOutro, SlideshowMusicSettings, SlideshowStyle, Upload } from "@/types";
import { Loader2, Monitor, Music, Play } from "lucide-react";

interface PresentationSlideshowProps {
  eventId: string;
  coupleName?: string;
  uploads: Upload[];
  loading?: boolean;
  /** Wait for event settings (incl. music) before allowing tap-to-start */
  eventLoading?: boolean;
  style?: SlideshowStyle;
  interval?: number;
  showTimestamp?: boolean;
  showPhotoCount?: boolean;
  showGuestNames?: boolean;
  intro?: SlideshowIntroOutro;
  outro?: SlideshowIntroOutro;
  music?: SlideshowMusicSettings;
  /** @deprecated Use music.enabled */
  musicEnabled?: boolean;
  /** TV / projector mode — larger typography, reception hint */
  displayMode?: boolean;
  exitHref?: string;
}

export function PresentationSlideshow({
  eventId,
  coupleName,
  uploads,
  loading,
  eventLoading = false,
  style,
  interval,
  showTimestamp,
  showPhotoCount,
  showGuestNames,
  intro,
  outro,
  music,
  musicEnabled,
  displayMode = false,
  exitHref,
}: PresentationSlideshowProps) {
  const router = useRouter();
  const sharedAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const photoCount = useMemo(() => filterSlideshowPhotos(uploads).length, [uploads]);
  const guestCount = useMemo(() => countUniqueGuests(filterSlideshowPhotos(uploads)), [uploads]);
  const musicSettings = music ?? (musicEnabled ? { enabled: true } : undefined);
  const launchReady = !eventLoading;

  const {
    containerRef,
    controlsVisible,
    hasStarted,
    startPresentation,
    handleInteraction,
    exitFullscreen,
  } = usePresentationControls({ autoHideMs: 3000 });

  const tryPlayMusic = useCallback(() => {
    if (!audioUnlockedRef.current || !music?.enabled || !music.trackUrl || !sharedAudioRef.current) {
      return;
    }
    sharedAudioRef.current.src = music.trackUrl;
    sharedAudioRef.current.loop = music.loop ?? true;
    sharedAudioRef.current.volume = music.volume ?? 0.75;
    void sharedAudioRef.current.play().catch(() => undefined);
  }, [music]);

  useEffect(() => {
    if (hasStarted && audioUnlockedRef.current) {
      tryPlayMusic();
    }
  }, [hasStarted, music, tryPlayMusic]);

  useEffect(() => {
    if (displayMode && launchReady && !hasStarted) {
      audioUnlockedRef.current = true;
      tryPlayMusic();
      void startPresentation();
    }
  }, [displayMode, launchReady, hasStarted, startPresentation, tryPlayMusic]);

  useEffect(() => {
    if (displayMode && launchReady && !hasStarted) {
      audioUnlockedRef.current = true;
      void startPresentation();
    }
  }, [displayMode, launchReady, hasStarted, startPresentation]);

  const handleStart = () => {
    if (!launchReady) return;
    audioUnlockedRef.current = true;
    tryPlayMusic();
    void startPresentation();
  };

  const handleExit = async () => {
    sharedAudioRef.current?.pause();
    await exitFullscreen();
    if (exitHref) {
      router.push(exitHref);
    } else {
      router.back();
    }
  };

  const showLaunch = !hasStarted && !displayMode;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black h-[100dvh] w-screen overflow-hidden touch-manipulation"
      onClick={hasStarted ? handleInteraction : undefined}
      onTouchStart={hasStarted ? handleInteraction : undefined}
      role="presentation"
    >
      {(music?.trackUrl || musicSettings?.enabled || eventLoading) && (
        <audio ref={sharedAudioRef} preload="auto" playsInline className="hidden" aria-hidden />
      )}

      {showLaunch ? (
        <button
          type="button"
          disabled={!launchReady}
          className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-black text-center px-4 sm:px-8 py-8 safe-top safe-bottom overflow-y-auto touch-scroll-y ${
            launchReady ? "cursor-pointer" : "cursor-wait opacity-90"
          }`}
          onClick={handleStart}
        >
          <div className="max-w-md space-y-4 sm:space-y-6 w-full">
            {!launchReady && (
              <p className="text-ivory/50 text-sm inline-flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading slideshow settings…
              </p>
            )}
            {displayMode ? (
              <>
                <Monitor className="w-10 h-10 sm:w-12 sm:h-12 text-champagne/70 mx-auto" />
                <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-ivory">Reception Display Mode</h1>
                <p className="text-ivory/60 text-sm leading-relaxed">
                  Connect this device to a TV or projector. Guest photos play automatically with
                  cinematic transitions — updating live as new uploads arrive.
                </p>
              </>
            ) : (
              <>
                <Play className="w-10 h-10 sm:w-12 sm:h-12 text-champagne/70 mx-auto fill-champagne/20" />
                <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-ivory">
                  {coupleName ? `${coupleName} Slideshow` : "Wedding Slideshow"}
                </h1>
                <p className="text-ivory/60 text-sm leading-relaxed">
                  Tap to enter fullscreen presentation mode. Photos from every guest&apos;s POV play
                  continuously — like a wedding reel on the big screen.
                </p>
              </>
            )}
            <span
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium ${
                launchReady
                  ? "bg-champagne/20 text-champagne"
                  : "bg-white/10 text-ivory/40"
              }`}
            >
              <Play className="w-4 h-4" /> {launchReady ? "Tap to Start" : "Loading…"}
            </span>
            {music?.enabled && music.trackUrl && (
              <p className="text-ivory/50 text-xs inline-flex items-center justify-center gap-1.5">
                <Music className="w-3.5 h-3.5" />
                {music.trackName ?? "Wedding music"} will play
              </p>
            )}
            {!loading && (
              <p className="text-ivory/40 text-xs">
                {photoCount > 0
                  ? `${guestCount} guest${guestCount === 1 ? "" : "s"} · ${photoCount} photo${photoCount === 1 ? "" : "s"} from every POV`
                  : "Waiting for guest uploads from any device…"}
              </p>
            )}
            <p className="text-ivory/30 text-xs">Tap anywhere for playback controls</p>
          </div>
        </button>
      ) : (
        <LiveSlideshow
          uploads={uploads}
          loading={loading}
          style={style}
          interval={interval}
          showTimestamp={showTimestamp}
          showPhotoCount={displayMode ? showPhotoCount : false}
          showGuestNames={showGuestNames}
          intro={intro}
          outro={outro}
          music={music}
          musicEnabled={musicEnabled ?? music?.enabled}
          externalAudioRef={sharedAudioRef}
          presentationMode
          displayMode={displayMode}
          controlsVisible={controlsVisible}
          onExit={handleExit}
          autoPlay
          loop
        />
      )}
    </div>
  );
}
