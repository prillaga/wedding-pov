"use client";

import { useRouter } from "next/navigation";
import { HeroBannerRenderer } from "@/components/hero/HeroBannerRenderer";
import type { WeddingEvent } from "@/types";

interface CoupleHeroProps {
  event: WeddingEvent;
  joinHref: string;
}

export function CoupleHero({ event, joinHref }: CoupleHeroProps) {
  const router = useRouter();

  return (
    <HeroBannerRenderer
      event={event}
      onJoinClick={() => router.push(joinHref)}
    />
  );
}
