import type {
  CameraFilter,
  EventSegment,
  HeroInvitationStyle,
  HeroLayout,
  HeroSettings,
  PhotoLimitValue,
  PhotoManagementSettings,
  VideoDurationLimit,
  ScreenBackgrounds,
  SlideshowStyle,
  ThemeColors,
  ThemePreset,
  TypographyStyle,
} from "@/types";

export const APP_NAME = "Wedding POV";
export const TAGLINE = "See the Wedding Through Every Guest's Eyes.";
/** Production URL used in QR codes when admin is on localhost. Override with NEXT_PUBLIC_APP_URL. */
export const PRODUCTION_APP_URL = "https://wedding-pov-two.vercel.app";

/** Client-side admin gate (deterrent for guest-facing demo; not server auth). */
export const ADMIN_PASSWORD = "prillaga321";
export const ADMIN_AUTH_KEY = "wedding-pov-admin-auth";

export const STORAGE_PLAN_GB = 50;

export const SEGMENT_DOWNLOAD_OPTIONS: { segment: EventSegment; label: string }[] = [
  { segment: "ceremony", label: "Ceremony Photos" },
  { segment: "cocktails", label: "Cocktails Photos" },
  { segment: "reception", label: "Reception Photos" },
  { segment: "first-dance", label: "First Dance Photos" },
  { segment: "speeches", label: "Speeches Photos" },
  { segment: "other", label: "Other Photos" },
];

export const SEGMENTS: { value: EventSegment; label: string }[] = [
  { value: "ceremony", label: "Ceremony" },
  { value: "cocktails", label: "Cocktails" },
  { value: "reception", label: "Reception" },
  { value: "first-dance", label: "First Dance" },
  { value: "speeches", label: "Speeches" },
  { value: "other", label: "Other" },
];

export const FILTERS: {
  value: CameraFilter;
  label: string;
  css: string;
}[] = [
  { value: "none", label: "Original", css: "none" },
  {
    value: "sketch",
    label: "Sketch",
    css: "contrast(1.4) brightness(1.1) saturate(0) sepia(0.3)",
  },
  {
    value: "black-white",
    label: "Black & White",
    css: "grayscale(1) contrast(1.15)",
  },
  {
    value: "vintage",
    label: "Vintage",
    css: "sepia(0.45) contrast(0.95) brightness(1.05) saturate(0.8)",
  },
  {
    value: "warm-wedding",
    label: "Warm Wedding Tone",
    css: "brightness(1.08) contrast(0.92) saturate(0.85) sepia(0.12)",
  },
  {
    value: "film",
    label: "Film Camera",
    css: "contrast(1.1) saturate(1.2) sepia(0.15) hue-rotate(-5deg)",
  },
];

export const PHOTO_LIMIT_OPTIONS: { value: PhotoLimitValue; label: string }[] = [
  { value: 1, label: "1" },
  { value: 5, label: "5" },
  { value: 10, label: "10" },
  { value: 15, label: "15" },
  { value: 20, label: "20" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
  { value: "unlimited", label: "Unlimited" },
];

export function getLimitNotification(maxPhotos: PhotoLimitValue): string {
  if (maxPhotos === "unlimited") {
    return "You have unlimited photo uploads.";
  }
  return `You have reached your upload limit of ${maxPhotos} photos.`;
}

export const SCREEN_LABELS: { key: keyof ScreenBackgrounds; label: string }[] = [
  { key: "app", label: "App Background" },
  { key: "homepage", label: "Homepage Background" },
  { key: "gallery", label: "Gallery Background" },
  { key: "slideshow", label: "Slideshow Background" },
  { key: "login", label: "Login Screen Background" },
  { key: "camera", label: "Camera Screen Background" },
  { key: "display", label: "Reception Display Background" },
];

export const COLOR_LABELS: { key: keyof ThemeColors; label: string }[] = [
  { key: "primary", label: "Primary Color" },
  { key: "secondary", label: "Secondary Color" },
  { key: "accent", label: "Accent Color" },
  { key: "button", label: "Button Color" },
  { key: "text", label: "Text Color" },
  { key: "header", label: "Header Color" },
  { key: "footer", label: "Footer Color" },
  { key: "progressBar", label: "Progress Bar Color" },
  { key: "navigation", label: "Navigation Menu Color" },
];

function extendColors(base: Omit<ThemeColors, "header" | "footer" | "progressBar" | "navigation">): ThemeColors {
  return {
    ...base,
    header: base.text,
    footer: base.secondary,
    progressBar: base.accent,
    navigation: base.accent,
  };
}
export const SLIDESHOW_STYLES: { value: SlideshowStyle; label: string }[] = [
  { value: "fade", label: "Fade" },
  { value: "zoom", label: "Zoom" },
  { value: "cinematic-pan", label: "Cinematic Pan" },
  { value: "film-strip", label: "Film Strip" },
  { value: "polaroid-drop", label: "Polaroid Drop" },
];

export const SLIDESHOW_PRESENTATION_STYLES = SLIDESHOW_STYLES.filter((s) =>
  (["fade", "zoom", "cinematic-pan"] as SlideshowStyle[]).includes(s.value)
);

export const SLIDESHOW_DURATION_OPTIONS = [
  { value: 3000, label: "3s" },
  { value: 5000, label: "5s" },
  { value: 8000, label: "8s" },
  { value: 10000, label: "10s" },
] as const;

export const THEME_PRESETS: Record<
  ThemePreset,
  { label: string; colors: ThemeColors }
> = {
  "white-gold": {
    label: "Classic White & Gold",
    colors: extendColors({ primary: "#FFFEF9", secondary: "#F5E6E0", accent: "#C9A962", text: "#2C2C2C", button: "#C9A962" }),
  },
  champagne: {
    label: "Champagne",
    colors: extendColors({ primary: "#FFFEF9", secondary: "#E8D5A3", accent: "#B8956A", text: "#3D3D3D", button: "#B8956A" }),
  },
  "rose-gold": {
    label: "Rose Gold",
    colors: extendColors({ primary: "#FFF9F7", secondary: "#F5E0D8", accent: "#B76E79", text: "#4A3F3F", button: "#B76E79" }),
  },
  "sage-green": {
    label: "Sage Green",
    colors: extendColors({ primary: "#FAFBF8", secondary: "#E8EDE4", accent: "#8A9A7B", text: "#2C3328", button: "#8A9A7B" }),
  },
  "royal-blue": {
    label: "Royal Blue",
    colors: extendColors({ primary: "#F8FAFC", secondary: "#E2E8F0", accent: "#1E3A5F", text: "#1A202C", button: "#1E3A5F" }),
  },
  "black-gold": {
    label: "Black & Gold",
    colors: extendColors({ primary: "#1A1A1A", secondary: "#2C2C2C", accent: "#D4AF37", text: "#F5F5F5", button: "#D4AF37" }),
  },
};

export const TYPOGRAPHY_OPTIONS: { value: TypographyStyle; label: string; heading: string; body: string }[] = [
  { value: "elegant-script", label: "Elegant Script", heading: "var(--font-cormorant)", body: "var(--font-outfit)" },
  { value: "luxury-serif", label: "Luxury Serif", heading: "Georgia, serif", body: "var(--font-outfit)" },
  { value: "modern-sans", label: "Modern Sans", heading: "var(--font-outfit)", body: "var(--font-outfit)" },
  { value: "minimalist", label: "Minimalist", heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
];

export const GALLERY_SORT_OPTIONS = [
  { value: "guest" as const, label: "By Guest" },
  { value: "timeline" as const, label: "By Timeline" },
  { value: "segment" as const, label: "By Ceremony Section" },
  { value: "newest" as const, label: "Newest Uploads" },
];

export const DEMO_EVENT_ID = "prillaga-wedding-2026";

export const DEFAULT_EVENT_SETTINGS = {
  brideName: "Jane",
  groomName: "John",
  weddingDate: "2027-06-20",
  venue: "The Garden Pavilion",
  hashtag: "#JohnAndJane2027",
  welcomeMessage: "Welcome! Capture your favorite moments and share your unique perspective of our special day.",
};

export const DEFAULT_PHOTO_LIMITS = {
  enabled: true,
  type: "total" as const,
  maxPhotos: 10 as const,
  limitReachedBehavior: "block" as const,
};

export const VIDEO_DURATION_OPTIONS: { value: VideoDurationLimit; label: string }[] = [
  { value: 60, label: "1 min" },
  { value: 120, label: "2 min" },
  { value: 180, label: "3 min" },
];

export const DEFAULT_VIDEO_LIMITS = {
  maxDurationSeconds: 180 as const,
};

export function formatRecordingTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getVideoDurationLabel(seconds: VideoDurationLimit): string {
  return VIDEO_DURATION_OPTIONS.find((o) => o.value === seconds)?.label ?? `${seconds / 60} min`;
}

export const DEFAULT_SCREEN_BACKGROUNDS: ScreenBackgrounds = {
  app: "#FFFEF9",
  homepage: "#F5E6E0",
  gallery: "#FFFEF9",
  slideshow: "#1A1A1A",
  login: "#F5E6E0",
  camera: "#0A0A0A",
  display: "#0A0A0A",
};

export const DEFAULT_HERO_TEXT_COLORS = {
  hashtag: "#C9A962",
  title: "#FFFFFF",
  date: "#FFFFFF",
  tagline: "#FFFFFF",
  button: "#C9A962",
  buttonText: "#FFFFFF",
};

export const HERO_LAYOUT_OPTIONS: { value: HeroLayout; label: string }[] = [
  { value: "full-screen", label: "Couple Photo Full Screen" },
  { value: "split-left", label: "Photo Left, Details Right" },
  { value: "invitation-center", label: "Centered Invitation Style" },
  { value: "video-background", label: "Video Background" },
  { value: "slideshow", label: "Animated Slideshow" },
];

export const HERO_INVITATION_STYLES: { value: HeroInvitationStyle; label: string }[] = [
  { value: "none", label: "Standard" },
  { value: "floral-border", label: "Floral Border" },
  { value: "gold-accents", label: "Gold Accents" },
  { value: "glass-card", label: "Glassmorphism Card" },
  { value: "luxury", label: "Luxury Wedding" },
  { value: "minimal", label: "Minimal Modern" },
];

export const DEFAULT_HERO: HeroSettings = {
  backgroundImages: [],
  backgroundSlideshow: false,
  slideshowInterval: 6000,
  imagePosition: { x: 50, y: 50 },
  imageZoom: 100,
  imageRotation: 0,
  brightness: 100,
  blurAmount: 0,
  overlayColor: "#000000",
  overlayGradient: { from: "#000000", to: "#000000", angle: 180 },
  overlayOpacity: 0.45,
  useGradientOverlay: true,
  lightOverlay: false,
  layout: "full-screen",
  invitationStyle: "luxury",
  textColors: { ...DEFAULT_HERO_TEXT_COLORS },
  textShadow: true,
  textBackdropBlur: 0,
};

export const DEFAULT_THEME = {
  preset: "white-gold" as const,
  colors: THEME_PRESETS["white-gold"].colors,
  typography: "luxury-serif" as const,
  backgroundMode: "dark-overlay" as const,
  screenBackgrounds: DEFAULT_SCREEN_BACKGROUNDS,
  hero: DEFAULT_HERO,
};

export const DEFAULT_SLIDESHOW = {
  style: "cinematic-pan" as const,
  showTimestamp: true,
  showPhotoCount: true,
  showGuestNames: true,
  transitionDuration: 5000,
  intro: {
    title: "John & Jane",
    subtitle: "Wedding Memories",
    line3: "Captured By Family & Friends",
    date: "June 20, 2027",
  },
  outro: {
    title: "Thank You",
    subtitle: "For Celebrating With Us",
    line3: "John & Jane",
  },
  music: { enabled: false, autoFade: true, loop: true },
};

export const LIMIT_TYPE_LABELS: Record<string, string> = {
  total: "Per Guest Total",
  hourly: "Per Hour",
  "per-section": "Per Event Section",
};

export const DEFAULT_MODERATION = {
  autoApprove: true,
  uploadsDisabled: false,
};

export const DEFAULT_PHOTO_MANAGEMENT: PhotoManagementSettings = {
  retakeBeforeUpload: true,
  deleteBeforeUpload: true,
  deleteAfterUpload: true,
  replaceUploadedPhotos: true,
  restoreSlotAfterDelete: true,
  afterUploadBehavior: "stay-in-camera",
};

export const AFTER_UPLOAD_OPTIONS: {
  value: PhotoManagementSettings["afterUploadBehavior"];
  label: string;
  description: string;
}[] = [
  {
    value: "stay-in-camera",
    label: "Stay in Camera",
    description: "Reopen the camera immediately for rapid photo capture (default).",
  },
  {
    value: "go-to-gallery",
    label: "Go to Gallery",
    description: "Navigate to the gallery after each upload.",
  },
  {
    value: "ask-user",
    label: "Ask User",
    description: "Let the guest choose to keep shooting or view the gallery.",
  },
];
