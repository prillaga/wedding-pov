"use client";

import { useLayoutEffect } from "react";
import { EventThemeProvider } from "@/components/theme/EventThemeProvider";
import { CoupleJoinFlow } from "@/components/home/CoupleJoinFlow";
import { DEMO_EVENT_ID } from "@/lib/constants";
import { getHardcodedDemoEvent } from "@/lib/demo-event";
import { seedSampleUploads } from "@/lib/store";

interface DemoWeddingGuestPageProps {
  startOnJoin?: boolean;
}

/** Demo wedding — always renders immediately, never reads localStorage on load. */
export default function DemoWeddingGuestPage({ startOnJoin = false }: DemoWeddingGuestPageProps) {
  const event = getHardcodedDemoEvent();

  useLayoutEffect(() => {
    void seedSampleUploads(DEMO_EVENT_ID);
  }, []);

  return (
    <EventThemeProvider event={event}>
      <CoupleJoinFlow event={event} startOnJoin={startOnJoin} />
    </EventThemeProvider>
  );
}
