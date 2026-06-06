"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlideshowEmptyState, SlideshowSkeleton } from "@/components/slideshow/SlideshowStates";
import {
  clampSlideIndex,
  filterSlideshowPhotos,
  nextSlideIndex,
  prevSlideIndex,
  slideshowLog,
} from "@/lib/slideshow-photos";
import { formatGuestNamePOV, formatGuestNamePOVUpper, formatTime, getSegmentLabel } from "@/lib/utils";
import type { SlideshowIntroOutro, SlideshowStyle, Upload } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  Music,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

interface LiveSlideshowProps {
  uploads: Upload[];
  style?: SlideshowStyle;
  showTimestamp?: boolean;
  showPhotoCount?: boolean;
  showGuestNames?: boolean;
  autoPlay?: boolean;
  interval?: number;
  fullscreen?: boolean;
  displayMode?: boolean;
  presentationMode?: boolean;
  controlsVisible?: boolean;
  onExit?: () => void;
  intro?: SlideshowIntroOutro;
  outro?: SlideshowIntroOutro;
  musicEnabled?: boolean;
  loading?: boolean;
  loop?: boolean;
  debug?: boolean;
}

function getTransitionVariants(style: SlideshowStyle) {
  switch (style) {
    case "zoom":
      return {
        initial: { opacity: 0, scale: 1.12 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.96 },
      };
    case "cinematic-pan":
      return {
        initial: { opacity: 0, x: 40, scale: 1.05 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: -40, scale: 1.02 },
      };
    case "film-strip":
      return {
        initial: { opacity: 0, y: -30, rotate: -1 },
        animate: { opacity: 1, y: 0, rotate: 0 },
        exit: { opacity: 0, y: 30, rotate: 1 },
      };
    case "polaroid-drop":
      return {
        initial: { opacity: 0, y: -80, rotate: 8, scale: 0.9 },
        animate: { opacity: 1, y: 0, rotate: -2, scale: 1 },
        exit: { opacity: 0, y: 60, rotate: -6, scale: 0.95 },
      };
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
  }
}

function TitleCard({ data, displayMode }: { data: SlideshowIntroOutro; displayMode?: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-charcoal text-center px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
      >
        <h2
          className={`font-serif text-ivory font-bold ${displayMode ? "text-5xl md:text-7xl" : "text-3xl"}`}
        >
          {data.title}
        </h2>
        <p className={`text-champagne mt-4 ${displayMode ? "text-2xl" : "text-lg"}`}>
          {data.subtitle}
        </p>
        {data.line3 && (
          <p className={`text-ivory/70 mt-3 italic ${displayMode ? "text-xl" : "text-base"}`}>
            {data.line3}
          </p>
        )}
        {data.date && (
          <p
            className={`text-ivory/50 mt-6 tracking-widest ${displayMode ? "text-lg" : "text-sm"}`}
          >
            {data.date}
          </p>
        )}
      </motion.div>
    </div>
  );
}

export function LiveSlideshow({
  uploads,
  style = "fade",
  showTimestamp = true,
  showPhotoCount = false,
  showGuestNames = true,
  autoPlay = true,
  interval = 3000,
  fullscreen = false,
  displayMode = false,
  presentationMode = false,
  controlsVisible = true,
  onExit,
  intro,
  outro,
  musicEnabled = false,
  loading = false,
  loop = true,
  debug = process.env.NODE_ENV === "development",
}: LiveSlideshowProps) {
  const photos = useMemo(() => filterSlideshowPhotos(uploads), [uploads]);
  const photoIds = useMemo(() => photos.map((p) => p.id).join(","), [photos]);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"intro" | "slides" | "outro">(
    intro && photos.length > 0 ? "intro" : "slides"
  );
  const [playing, setPlaying] = useState(autoPlay);
  const [musicOn, setMusicOn] = useState(musicEnabled);
  const indexRef = useRef(index);
  const photosRef = useRef(photos);

  indexRef.current = index;
  photosRef.current = photos;

  const variants = getTransitionVariants(style);
  const current = photos[index] ?? null;

  const guestPhotoIndex =
    current
      ? photos.filter((u) => u.guestId === current.guestId).findIndex((u) => u.id === current.id) +
        1
      : 0;
  const guestPhotoTotal = current
    ? photos.filter((u) => u.guestId === current.guestId).length
    : 0;

  const log = useCallback(
    (msg: string, data?: unknown) => {
      if (debug) slideshowLog(msg, data);
    },
    [debug]
  );

  // Sync index when photos are added, deleted, or replaced
  useEffect(() => {
    setIndex((prev) => {
      const clamped = clampSlideIndex(prev, photos.length);
      if (clamped !== prev) {
        log("Index clamped after photo list change", { prev, clamped, count: photos.length });
      }
      return clamped;
    });

    if (photos.length === 0) {
      setPhase(intro ? "intro" : "slides");
    } else if (phase === "slides" && photos.length > 0) {
      // stay on slides
    }

    log("Photos updated", { count: photos.length, ids: photos.map((p) => p.id) });
  }, [photoIds, photos.length, log, intro, phase]);

  const goNext = useCallback(() => {
    const list = photosRef.current;
    const count = list.length;

    if (phase === "intro") {
      setPhase("slides");
      setIndex(0);
      log("Intro → slides");
      return;
    }

    if (count === 0) return;

    if (phase === "slides") {
      const next = nextSlideIndex(indexRef.current, count);
      if (next === 0 && indexRef.current === count - 1) {
        if (loop && outro && count > 0) {
          setPhase("outro");
          log("Last slide → outro");
          return;
        }
        setIndex(0);
        log("Loop to first slide", { count });
        return;
      }
      setIndex(next);
      log("Next slide", { from: indexRef.current, to: next, count });
      return;
    }

    if (phase === "outro") {
      setPhase("slides");
      setIndex(0);
      log("Outro → loop to first slide");
    }
  }, [phase, loop, outro, log]);

  const goPrev = useCallback(() => {
    const count = photosRef.current.length;
    if (count === 0) return;

    if (phase === "outro") {
      setPhase("slides");
      setIndex(Math.max(0, count - 1));
      return;
    }
    if (phase === "intro") return;

    setIndex((prev) => {
      const next = prevSlideIndex(prev, count);
      log("Previous slide", { from: prev, to: next, count });
      return next;
    });
  }, [phase, log]);

  // Auto-advance timer — stable deps, uses refs for latest state
  useEffect(() => {
    if (!playing) return;

    const duration =
      phase === "intro" || phase === "outro"
        ? 4000
        : Math.max(2000, interval);

    if (phase === "slides" && photos.length === 0) return;

    log("Timer started", { duration, phase, photoCount: photos.length });

    const timer = setInterval(() => {
      goNext();
    }, duration);

    return () => {
      clearInterval(timer);
      log("Timer cleared");
    };
  }, [playing, interval, phase, photos.length, goNext, log]);

  useEffect(() => {
    log("Slide changed", {
      index,
      photoId: current?.id,
      guest: current ? formatGuestNamePOV(current.guestName) : null,
      phase,
    });
  }, [index, current?.id, phase, log, current]);

  if (loading) {
    return (
      <SlideshowSkeleton
        displayMode={displayMode || presentationMode}
        fullscreen={fullscreen || presentationMode}
      />
    );
  }

  if (photos.length === 0 && !intro) {
    return (
      <SlideshowEmptyState
        displayMode={displayMode || presentationMode}
        fullscreen={fullscreen || presentationMode}
      />
    );
  }

  if (photos.length === 0 && phase !== "intro") {
    return (
      <SlideshowEmptyState
        displayMode={displayMode || presentationMode}
        fullscreen={fullscreen || presentationMode}
      />
    );
  }

  const isImmersive = presentationMode || displayMode || fullscreen;
  const showControls = presentationMode ? controlsVisible : true;

  const containerClass = presentationMode
    ? "h-[100dvh] w-screen bg-black"
    : displayMode
      ? "h-screen w-screen bg-black"
      : fullscreen
        ? "h-screen bg-charcoal"
        : "rounded-[28px] aspect-[16/10] bg-charcoal luxury-shadow";

  return (
    <div className={`relative overflow-hidden ${containerClass}`}>
      <AnimatePresence mode="wait">
        {phase === "intro" && intro ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <TitleCard data={intro} displayMode={displayMode} />
          </motion.div>
        ) : phase === "outro" && outro ? (
          <motion.div
            key="outro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <TitleCard data={outro} displayMode={displayMode} />
          </motion.div>
        ) : current ? (
          <motion.div
            key={current.id}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{
              duration: style === "fade" ? 0.9 : style === "polaroid-drop" ? 0.9 : 1.2,
              ease: [0.4, 0, 0.2, 1],
            }}
            className={`absolute inset-0 ${style === "polaroid-drop" ? "p-8 md:p-16 flex items-center justify-center" : ""}`}
          >
            {style === "film-strip" && (
              <div className="absolute top-0 inset-x-0 h-8 bg-black/80 z-10 flex items-center px-4 gap-1">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="w-2 h-4 bg-ivory/20 rounded-sm" />
                ))}
              </div>
            )}
            <div
              className={`w-full h-full overflow-hidden ${
                style === "polaroid-drop" ? "max-w-md bg-white p-3 pb-12 rotate-[-2deg]" : ""
              }`}
            >
              <img
                src={current.imageData}
                alt={current.caption ?? "Wedding moment"}
                className={`w-full object-cover ${
                  style === "polaroid-drop" ? "aspect-square" : "h-full animate-kenburns"
                }`}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {phase === "slides" && current && (
        <div
          className={`absolute inset-x-0 z-10 pointer-events-none ${
            isImmersive
              ? displayMode
                ? "bottom-0 p-8 md:p-14 lg:p-20"
                : "bottom-0 p-6 md:p-10"
              : "bottom-0 p-5"
          }`}
        >
          <motion.div
            key={`text-${current.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h2
              className={`font-serif font-semibold text-ivory ${
                displayMode
                  ? "text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl tracking-wide"
                  : presentationMode
                    ? "text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
                    : "text-xl md:text-2xl tracking-wider font-bold"
              }`}
            >
              {showGuestNames
                ? displayMode
                  ? formatGuestNamePOVUpper(current.guestName)
                  : formatGuestNamePOV(current.guestName)
                : "Wedding POV"}
            </h2>
            {current.caption && !presentationMode && (
              <p
                className={`text-ivory/80 italic mt-2 ${
                  displayMode ? "text-xl md:text-2xl" : "text-sm md:text-base"
                }`}
              >
                {current.caption}
              </p>
            )}
            {showTimestamp && (
              <p
                className={`text-champagne/90 mt-2 ${
                  displayMode
                    ? "text-lg sm:text-xl md:text-2xl"
                    : presentationMode
                      ? "text-sm sm:text-base md:text-lg"
                      : "text-xs"
                }`}
              >
                {getSegmentLabel(current.segment)} • {formatTime(current.createdAt)}
              </p>
            )}
            {showPhotoCount && guestPhotoTotal > 0 && (
              <p
                className={`text-ivory/50 mt-2 ${
                  displayMode ? "text-base md:text-lg" : "text-xs"
                }`}
              >
                Photo {guestPhotoIndex} of {guestPhotoTotal}
              </p>
            )}
          </motion.div>
        </div>
      )}

      {/* Exit — presentation mode only, visible on tap */}
      {presentationMode && showControls && onExit && (
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            onExit();
          }}
          aria-label="Exit fullscreen"
          className="absolute top-4 right-4 md:top-6 md:right-6 z-30 p-3 rounded-full bg-black/50 text-ivory/90 backdrop-blur-md border border-white/10 hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </motion.button>
      )}

      {/* Playback controls — always visible in embed; tap-to-show in presentation */}
      {showControls && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`absolute z-20 flex items-center gap-2 md:gap-3 ${
            presentationMode
              ? "bottom-6 md:bottom-10 left-1/2 -translate-x-1/2"
              : displayMode
                ? "bottom-8 right-8"
                : "top-4 right-4"
          }`}
        >
          {presentationMode && (
            <>
              {photos.length > 1 && phase === "slides" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrev();
                  }}
                  aria-label="Previous slide"
                  className="p-3 md:p-4 rounded-full bg-black/50 text-ivory/90 backdrop-blur-md border border-white/10 hover:bg-black/70"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPlaying((p) => !p);
                }}
                aria-label={playing ? "Pause slideshow" : "Play slideshow"}
                className="p-3 md:p-4 rounded-full bg-black/50 text-ivory/90 backdrop-blur-md border border-white/10 hover:bg-black/70"
              >
                {playing ? (
                  <Pause className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                  <Play className="w-5 h-5 md:w-6 md:h-6" />
                )}
              </button>
              {photos.length > 1 && phase === "slides" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext();
                  }}
                  aria-label="Next slide"
                  className="p-3 md:p-4 rounded-full bg-black/50 text-ivory/90 backdrop-blur-md border border-white/10 hover:bg-black/70"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              )}
            </>
          )}
          {!presentationMode && (
            <>
              {phase === "slides" && photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous slide"
                    className="p-2 rounded-full bg-black/40 text-ivory/80 backdrop-blur-sm hover:bg-black/60"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next slide"
                    className="p-2 rounded-full bg-black/40 text-ivory/80 backdrop-blur-sm hover:bg-black/60"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setMusicOn(!musicOn)}
                aria-label="Toggle music"
                className="p-2 rounded-full bg-black/40 text-ivory/80 backdrop-blur-sm hover:bg-black/60"
              >
                {musicOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setPlaying(!playing)}
                aria-label={playing ? "Pause slideshow" : "Play slideshow"}
                className="p-2 rounded-full bg-black/40 text-ivory/80 backdrop-blur-sm hover:bg-black/60"
              >
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </>
          )}
        </motion.div>
      )}

      {musicOn && !presentationMode && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 text-ivory/60 text-xs backdrop-blur-sm">
          <Music className="w-3 h-3" /> Wedding music
        </div>
      )}

      {debug && !presentationMode && photos.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-2 py-1 rounded bg-black/50 text-[10px] text-ivory/50 font-mono">
          {index + 1}/{photos.length} · {phase}
        </div>
      )}
    </div>
  );
}
