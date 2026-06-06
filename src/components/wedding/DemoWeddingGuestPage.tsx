"use client";

import { EventThemeProvider } from "@/components/theme/EventThemeProvider";
import { CoupleJoinFlow } from "@/components/home/CoupleJoinFlow";
import { getHardcodedDemoEvent } from "@/lib/demo-event";

interface DemoWeddingGuestPageProps {
  startOnJoin?: boolean;
}

/** Demo wedding — always renders immediately, never reads localStorage on load. */
export default function DemoWeddingGuestPage({ startOnJoin = false }: DemoWeddingGuestPageProps) {
  const event = getHardcodedDemoEvent();

  return (
    <EventThemeProvider event={event}>
      <CoupleJoinFlow event={event} startOnJoin={startOnJoin} />
    </EventThemeProvider>
  );
}
