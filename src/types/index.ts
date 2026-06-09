export type EventSegment =
  | "ceremony"
  | "cocktails"
  | "reception"
  | "first-dance"
  | "speeches"
  | "other";

export type CameraFilter =
  | "none"
  | "sketch"
  | "film"
  | "black-white"
  | "vintage"
  | "warm-wedding";

export type UploadStatus = "pending" | "approved" | "removed" | "extra";

export type PhotoLimitType = "total" | "hourly" | "per-section";

export type PhotoLimitValue = 1 | 5 | 10 | 15 | 20 | 25 | 50 | 100 | "unlimited";

export type LimitReachedBehavior = "block" | "mark-extra" | "unlimited";

export type GallerySort = "guest" | "timeline" | "segment" | "newest";

export type SlideshowStyle =
  | "fade"
  | "zoom"
  | "cinematic-pan"
  | "film-strip"
  | "polaroid-drop";

export type ScreenKey =
  | "app"
  | "homepage"
  | "gallery"
  | "slideshow"
  | "login"
  | "camera"
  | "display";

export type TemplateType = "theme" | "colors" | "backgrounds" | "limits" | "full";

export type ThemePreset =
  | "white-gold"
  | "champagne"
  | "rose-gold"
  | "sage-green"
  | "royal-blue"
  | "black-gold";

export type TypographyStyle = "elegant-script" | "luxury-serif" | "modern-sans" | "minimalist";

export type BackgroundMode = "photo" | "blur" | "dark-overlay" | "slideshow" | "light-overlay";

export type HeroLayout =
  | "full-screen"
  | "split-left"
  | "invitation-center"
  | "video-background"
  | "slideshow";

export type HeroInvitationStyle =
  | "none"
  | "floral-border"
  | "gold-accents"
  | "glass-card"
  | "luxury"
  | "minimal";

export interface HeroTextColors {
  hashtag: string;
  title: string;
  date: string;
  tagline: string;
  button: string;
  buttonText: string;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  relationship?: string;
  joinedAt: string;
}

export interface PhotoLimitSettings {
  enabled: boolean;
  type: PhotoLimitType;
  maxPhotos: PhotoLimitValue;
  limitReachedBehavior: LimitReachedBehavior;
}

/** Max length for a single in-app video recording (seconds). */
export type VideoDurationLimit = 60 | 120 | 180;

export interface VideoLimitSettings {
  maxDurationSeconds: VideoDurationLimit;
}

export interface EventSettings {
  brideName: string;
  groomName: string;
  weddingDate: string;
  venue: string;
  hashtag: string;
  welcomeMessage: string;
  /** Event type for Print Center filtering */
  eventType?: "wedding" | "birthday" | "graduation" | "corporate" | "other";
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  button: string;
  header: string;
  footer: string;
  progressBar: string;
  navigation: string;
}

export interface ScreenBackgrounds {
  app: string;
  homepage: string;
  gallery: string;
  slideshow: string;
  login: string;
  camera: string;
  display: string;
}

export interface HeroSettings {
  couplePhoto?: string;
  backgroundImages: string[];
  backgroundSlideshow: boolean;
  slideshowInterval: number;
  imagePosition: { x: number; y: number };
  imageZoom: number;
  imageRotation: number;
  brightness: number;
  blurAmount: number;
  overlayColor: string;
  overlayGradient: { from: string; to: string; angle: number };
  overlayOpacity: number;
  useGradientOverlay: boolean;
  lightOverlay: boolean;
  layout: HeroLayout;
  invitationStyle: HeroInvitationStyle;
  textColors: HeroTextColors;
  textShadow: boolean;
  textBackdropBlur: number;
  videoBackgroundUrl?: string;
}

export interface ThemeSettings {
  preset: ThemePreset | "custom";
  colors: ThemeColors;
  typography: TypographyStyle;
  backgroundImage?: string;
  backgroundMode: BackgroundMode;
  screenBackgrounds: ScreenBackgrounds;
  hero: HeroSettings;
}

export type ThemeSettingsPatch = Partial<
  Omit<ThemeSettings, "colors" | "screenBackgrounds" | "hero">
> & {
  colors?: Partial<ThemeColors>;
  screenBackgrounds?: Partial<ScreenBackgrounds>;
  hero?: Partial<HeroSettings>;
};

export interface SlideshowIntroOutro {
  title: string;
  subtitle: string;
  line3?: string;
  date?: string;
}

export type SlideshowBeatsPerSlide = 2 | 4 | 8;

export interface SlideshowMusicSettings {
  enabled: boolean;
  autoFade: boolean;
  loop: boolean;
  trackName?: string;
  /** Public URL (Vercel Blob) or local data URL for the audio file */
  trackUrl?: string;
  /** Advance slides on musical beats instead of fixed duration */
  syncToBeat?: boolean;
  /** Beats per minute — auto-detected on upload or set manually */
  bpm?: number;
  beatsPerSlide?: SlideshowBeatsPerSlide;
  volume?: number;
}

export interface SlideshowConfig {
  style: SlideshowStyle;
  showTimestamp: boolean;
  showPhotoCount: boolean;
  showGuestNames: boolean;
  transitionDuration: number;
  intro: SlideshowIntroOutro;
  outro: SlideshowIntroOutro;
  music: SlideshowMusicSettings;
}

export interface AdminTemplate {
  id: string;
  name: string;
  type: TemplateType;
  createdAt: string;
  theme?: Partial<ThemeSettings>;
  photoLimits?: Partial<PhotoLimitSettings>;
  videoLimits?: Partial<VideoLimitSettings>;
}

export interface PhotoManagementSettings {
  retakeBeforeUpload: boolean;
  deleteBeforeUpload: boolean;
  deleteAfterUpload: boolean;
  replaceUploadedPhotos: boolean;
  restoreSlotAfterDelete: boolean;
  /** Where to send the guest after a successful upload */
  afterUploadBehavior: AfterUploadBehavior;
}

export type AfterUploadBehavior = "stay-in-camera" | "go-to-gallery" | "ask-user";

export interface ModerationSettings {
  autoApprove: boolean;
  uploadsDisabled: boolean;
}

export type EventStatus = "active" | "paused" | "archived";

export interface StorageDashboardStats {
  totalPhotos: number;
  storageUsedGB: number;
  storageLimitGB: number;
  activeEvents: number;
  archivedEvents: number;
}

export interface WeddingEvent {
  id: string;
  coupleName: string;
  weddingDate: string;
  venue: string;
  createdAt: string;
  status?: EventStatus;
  archivedAt?: string;
  pin?: string;
  settings: EventSettings;
  photoLimits: PhotoLimitSettings;
  videoLimits: VideoLimitSettings;
  theme: ThemeSettings;
  slideshow: SlideshowConfig;
  moderation: ModerationSettings;
  photoManagement: PhotoManagementSettings;
}

export interface Upload {
  id: string;
  eventId: string;
  guestId: string;
  guestName: string;
  imageData: string;
  caption?: string;
  segment: EventSegment;
  filter: CameraFilter;
  isVideo: boolean;
  status: UploadStatus;
  isExtra?: boolean;
  /** When true, deleted upload still counts toward guest photo limit */
  slotLocked?: boolean;
  createdAt: string;
}

export type GalleryView = "timeline" | "guest" | "segment";

export type HighlightReelType = "1min" | "3min" | "full";

export interface GuestLimitSummary {
  guestId: string;
  guestName: string;
  used: number;
  max: number | null;
  remaining: number | null;
  isAtLimit: boolean;
}

export interface EventStats {
  totalUploads: number;
  totalGuests: number;
  averagePhotosPerGuest: number;
  storageUsedMB: number;
  uploadsBySegment: Record<EventSegment, number>;
  uploadsByGuest: Record<string, number>;
  topContributors: { name: string; count: number }[];
  recentUploads: Upload[];
  mostViewedPhotos: { upload: Upload; views: number }[];
  guestLimits: GuestLimitSummary[];
}

export interface GuestUploadQuota {
  used: number;
  max: number | null;
  remaining: number | null;
  isLimited: boolean;
  isAtLimit: boolean;
  canUpload: boolean;
  limitType: PhotoLimitType;
}
