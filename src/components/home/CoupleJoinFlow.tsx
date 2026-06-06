"use client";

import { useState } from "react";
import { HeroBannerRenderer } from "@/components/hero/HeroBannerRenderer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { registerGuest, seedDemoEvent } from "@/lib/store";
import { DEMO_EVENT_ID } from "@/lib/constants";
import { formatGuestPOV } from "@/lib/utils";
import type { WeddingEvent } from "@/types";

interface CoupleJoinFlowProps {
  event: WeddingEvent;
  startOnJoin?: boolean;
}

export function CoupleJoinFlow({ event, startOnJoin = false }: CoupleJoinFlowProps) {
  const { settings } = event;
  const coupleLabel = `${settings.groomName} & ${settings.brideName}`;

  const [step, setStep] = useState<"hero" | "join">(startOnJoin ? "join" : "hero");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  const handleJoin = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name");
      return;
    }

    setJoining(true);
    setError("");

    try {
      if (event.id === DEMO_EVENT_ID) {
        seedDemoEvent();
      }
      registerGuest(event.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      window.location.href = `/event/${event.id}/camera`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join. Please try again.");
      setJoining(false);
    }
  };

  const previewName =
    firstName.trim() && lastName.trim()
      ? formatGuestPOV({ firstName: firstName.trim(), lastName: lastName.trim() })
      : null;

  return (
    <HeroBannerRenderer
      event={event}
      showJoinButton={step === "hero"}
      onJoinClick={() => setStep("join")}
    >
      {step === "join" && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center px-4 sm:px-6 py-6 sm:py-16 safe-top safe-bottom overflow-y-auto touch-scroll-y">
          <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-left shadow-xl max-h-[min(92dvh,720px)] overflow-y-auto touch-scroll-y">
            <button
              type="button"
              onClick={() => setStep("hero")}
              className="text-sm text-champagne mb-4 cursor-pointer touch-target"
            >
              ← Back
            </button>
            <h2 className="font-serif text-xl sm:text-2xl text-charcoal text-center mb-1">
              Join {coupleLabel}
            </h2>
            <p className="text-warm-gray text-sm text-center mb-5">
              Enter your first and last name to start taking photos.
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
              Continue
            </Button>
          </div>
        </div>
      )}
    </HeroBannerRenderer>
  );
}
