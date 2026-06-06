"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { LiveSlideshow } from "@/components/slideshow/LiveSlideshow";
import { filterSlideshowPhotos } from "@/lib/slideshow-photos";
import { usePresentationControls } from "@/hooks/usePresentationControls";
import type { SlideshowIntroOutro, SlideshowStyle, Upload } from "@/types";
import { Monitor, Play } from "lucide-react";

interface PresentationSlideshowProps {
  eventId: string;
  coupleName?: string;
  uploads: Upload[];
  loading?: boolean;
  style?: SlideshowStyle;
  interval?: number;
  showTimestamp?: boolean;
  showPhotoCount?: boolean;
  showGuestNames?: boolean;
  intro?: SlideshowIntroOutro;
  outro?: SlideshowIntroOutro;
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
  style,
  interval,
  showTimestamp,
  showPhotoCount,
  showGuestNames,
  intro,
  outro,
  musicEnabled,
  displayMode = false,
  exitHref,
}: PresentationSlideshowProps) {
  const router = useRouter();
  const photoCount = useMemo(() => filterSlideshowPhotos(uploads).length, [uploads]);
  const {
    containerRef,
    controlsVisible,
    hasStarted,
    startPresentation,
    handleInteraction,
    exitFullscreen,
  } = usePresentationControls({ autoHideMs: 3000 });

  const handleExit = async () => {
    await exitFullscreen();
    if (exitHref) {
      router.push(exitHref);
    } else {
      router.back();
    }
  };

  const showLaunch = !hasStarted;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black h-[100dvh] w-screen overflow-hidden touch-manipulation"
      onClick={hasStarted ? handleInteraction : undefined}
      onTouchStart={hasStarted ? handleInteraction : undefined}
      role="presentation"
    >
      {showLaunch ? (
        <button
          type="button"
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black text-center px-4 sm:px-8 py-8 safe-top safe-bottom overflow-y-auto touch-scroll-y cursor-pointer"
          onClick={startPresentation}
        >
          <div className="max-w-md space-y-4 sm:space-y-6 w-full">
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
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-champagne/20 text-champagne text-sm font-medium">
              <Play className="w-4 h-4" /> Tap to Start
            </span>
            {!loading && (
              <p className="text-ivory/40 text-xs">
                {photoCount > 0
                  ? `${photoCount} photo${photoCount === 1 ? "" : "s"} ready to play`
                  : "No guest photos yet — sample photos will appear after you join and upload"}
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
          musicEnabled={musicEnabled}
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
