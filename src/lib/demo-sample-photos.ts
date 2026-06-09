import type { EventSegment } from "@/types";

/** Bump when sample gallery photos change — triggers a full demo gallery reset. */
export const DEMO_SAMPLE_GALLERY_VERSION = 4;

export const DEMO_SAMPLE_GALLERY_VERSION_KEY = "wedding-pov-demo-gallery-version";

/** When set, JJ2027 gallery stays empty — sample photos are not auto-seeded. */
export const DEMO_SAMPLE_GALLERY_CLEARED_KEY = "wedding-pov-demo-gallery-cleared";

/** Wedding date for JJ2027 demo — timestamps align with sample slideshow labels. */
export const DEMO_WEDDING_DAY = "2027-06-20";

export interface DemoSamplePhoto {
  id: string;
  guestId: string;
  firstName: string;
  lastName: string;
  caption: string;
  segment: EventSegment;
  /** Local time on wedding day, e.g. "18:12" */
  time: string;
  imagePath: string;
}

export const DEMO_SAMPLE_PHOTOS: DemoSamplePhoto[] = [
  {
    id: "demo-sample-ceremony-exit",
    guestId: "demo-guest-ethan-smith",
    firstName: "Ethan",
    lastName: "Smith",
    caption: "Ceremony Exit",
    segment: "ceremony",
    time: "18:12",
    imagePath: "/sample-photos/ceremony-exit.png",
  },
  {
    id: "demo-sample-first-dance",
    guestId: "demo-guest-michael-reyes",
    firstName: "Michael",
    lastName: "Reyes",
    caption: "First Dance",
    segment: "first-dance",
    time: "20:42",
    imagePath: "/sample-photos/first-dance.png",
  },
  {
    id: "demo-sample-group-selfie",
    guestId: "demo-guest-jake-doe",
    firstName: "Jake",
    lastName: "Doe",
    caption: "Reception Selfie",
    segment: "reception",
    time: "20:55",
    imagePath: "/sample-photos/group-selfie.png",
  },
  {
    id: "demo-sample-reception-table",
    guestId: "demo-guest-sarah-johnson",
    firstName: "Sarah",
    lastName: "Johnson",
    caption: "Table 7 Memories",
    segment: "reception",
    time: "19:30",
    imagePath: "/sample-photos/reception-table.png",
  },
  {
    id: "demo-sample-wedding-vows",
    guestId: "demo-guest-emily-cruz",
    firstName: "Emily",
    lastName: "Cruz",
    caption: "Wedding Vows",
    segment: "ceremony",
    time: "17:48",
    imagePath: "/sample-photos/wedding-vows.png",
  },
];

/** Extra demo guests shown in stats — no photos yet, ready for live uploads. */
export const DEMO_SAMPLE_GUEST_NAMES = [
  { id: "demo-guest-olivia-santos", firstName: "Olivia", lastName: "Santos" },
  { id: "demo-guest-daniel-garcia", firstName: "Daniel", lastName: "Garcia" },
  { id: "demo-guest-sophia-lee", firstName: "Sophia", lastName: "Lee" },
  { id: "demo-guest-noah-wilson", firstName: "Noah", lastName: "Wilson" },
  { id: "demo-guest-mia-brown", firstName: "Mia", lastName: "Brown" },
] as const;

export function demoSampleCreatedAt(time: string): string {
  return new Date(`${DEMO_WEDDING_DAY}T${time}:00`).toISOString();
}
