"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TAGLINE } from "@/lib/constants";
import { registerGuest } from "@/lib/store";
import { formatDate, formatGuestPOV } from "@/lib/utils";
import type { WeddingEvent } from "@/types";
import { Calendar, Heart, MapPin } from "lucide-react";

interface CoupleJoinFlowProps {
  event: WeddingEvent;
  startOnJoin?: boolean;
}

export function CoupleJoinFlow({ event, startOnJoin = false }: CoupleJoinFlowProps) {
  const { settings, theme } = event;
  const { hero } = theme;
  const coupleLabel = `${settings.groomName} & ${settings.brideName}`;

  const [step, setStep] = useState<"hero" | "join">(startOnJoin ? "join" : "hero");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  const heroImage =
    hero.couplePhoto ??
    theme.backgroundImage ??
    hero.backgroundImages[0];

  useEffect(() => {
    if (!hero.backgroundSlideshow || hero.backgroundImages.length < 2) return;
    const timer = setInterval(() => {
      setBgIndex((i) => (i + 1) % hero.backgroundImages.length);
    }, hero.slideshowInterval);
    return () => clearInterval(timer);
  }, [hero.backgroundSlideshow, hero.backgroundImages, hero.slideshowInterval]);

  const slideshowImage =
    hero.backgroundSlideshow && hero.backgroundImages.length > 0
      ? hero.backgroundImages[bgIndex]
      : heroImage;

  const bgStyle: React.CSSProperties = slideshowImage
    ? {
        backgroundImage: `url(${slideshowImage})`,
        backgroundSize: `${hero.imageZoom}%`,
        backgroundPosition: `${hero.imagePosition.x}% ${hero.imagePosition.y}%`,
        filter:
          theme.backgroundMode === "blur" ? `blur(${hero.blurAmount || 8}px)` : undefined,
      }
    : {
        background: `linear-gradient(160deg, ${theme.screenBackgrounds?.homepage ?? theme.colors.secondary} 0%, ${theme.colors.primary} 50%, ${theme.colors.secondary} 100%)`,
      };

  const overlayStyle: React.CSSProperties = hero.useGradientOverlay
    ? {
        background: `linear-gradient(${hero.overlayGradient.angle}deg, ${hero.overlayGradient.from}, ${hero.overlayGradient.to})`,
        opacity: hero.overlayOpacity,
      }
    : {
        background: hero.overlayColor,
        opacity: hero.overlayOpacity,
      };

  const handleJoin = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name");
      return;
    }

    setJoining(true);
    setError("");

    try {
      registerGuest(event.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        relationship: relationship.trim() || undefined,
      });
      window.location.href = `/event/${event.id}`;
    } catch {
      setError("Could not join. Clear browser data and try again.");
      setJoining(false);
    }
  };

  const previewName =
    firstName.trim() && lastName.trim()
      ? formatGuestPOV({ firstName: firstName.trim(), lastName: lastName.trim() })
      : null;

  return (
    <section
      className="relative min-h-dvh flex flex-col"
      style={{ background: theme.screenBackgrounds?.homepage ?? theme.colors.primary }}
    >
      <div className="absolute inset-0 pointer-events-none" style={bgStyle} />
      <div className="absolute inset-0 pointer-events-none" style={overlayStyle} />

      <div className="relative z-30 flex-1 flex flex-col items-center justify-center px-6 py-16 text-center safe-top safe-bottom">
        <AnimatePresence mode="wait">
          {step === "hero" ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg w-full"
            >
              <p
                className="text-sm tracking-[0.3em] uppercase mb-6 opacity-80"
                style={{ color: theme.colors.accent }}
              >
                {settings.hashtag}
              </p>
              <h1
                className="text-5xl md:text-6xl font-semibold mb-4 leading-tight text-white"
                style={{ fontFamily: "var(--event-heading-font, Georgia, serif)" }}
              >
                {coupleLabel}
              </h1>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-white/80 text-sm mb-6">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" style={{ color: theme.colors.accent }} />
                  {formatDate(settings.weddingDate)}
                </span>
                <span className="hidden sm:inline opacity-40">·</span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" style={{ color: theme.colors.accent }} />
                  {settings.venue}
                </span>
              </div>
              <p className="text-white/70 text-base md:text-lg font-light mb-10">{TAGLINE}</p>

              <button
                type="button"
                onClick={() => setStep("join")}
                className="inline-flex items-center justify-center gap-2 font-medium px-8 py-4 text-lg rounded-full min-w-[220px] cursor-pointer relative z-50"
                style={{
                  background: theme.colors.button,
                  color: theme.preset === "black-gold" ? "#1A1A1A" : "#fff",
                }}
              >
                <Heart className="w-5 h-5" />
                Join Event
              </button>

              {settings.welcomeMessage && (
                <p className="mt-8 text-white/50 text-sm max-w-md mx-auto leading-relaxed">
                  {settings.welcomeMessage}
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl p-6 text-left shadow-xl"
            >
              <button
                type="button"
                onClick={() => setStep("hero")}
                className="text-sm text-champagne mb-4 cursor-pointer"
              >
                ← Back
              </button>
              <h2 className="font-serif text-2xl text-charcoal text-center mb-1">
                Join {coupleLabel}
              </h2>
              <p className="text-warm-gray text-sm text-center mb-5">
                Enter your name — no account needed
              </p>

              <div className="space-y-3">
                <Input
                  label="First Name *"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setError("");
                  }}
                  placeholder="John"
                />
                <Input
                  label="Last Name *"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setError("");
                  }}
                  placeholder="Doe"
                />
                <Input
                  label="Relationship (optional)"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="College friend"
                />
              </div>

              {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

              <div className="mt-4 p-3 rounded-xl bg-blush/50 text-center">
                <p className="text-xs text-warm-gray">You&apos;ll appear as</p>
                <p className="font-serif text-lg">
                  {previewName ? (
                    <>
                      {previewName.replace(/'s POV$/, "")}
                      <span className="text-champagne">&apos;s POV</span>
                    </>
                  ) : (
                    <>
                      Your Name<span className="text-champagne">&apos;s POV</span>
                    </>
                  )}
                </p>
              </div>

              <Button
                variant="gold"
                size="lg"
                className="w-full mt-5"
                onClick={handleJoin}
                loading={joining}
              >
                Join the Wedding
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
