"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Select } from "@/components/ui/Input";
import { CameraSuccessToast } from "@/components/camera/CameraSuccessToast";
import { LimitReachedScreen } from "@/components/camera/LimitReachedScreen";
import { PhotoPreviewScreen } from "@/components/camera/PhotoPreviewScreen";
import { PostUploadPrompt } from "@/components/camera/PostUploadPrompt";
import { UploadIndicator } from "@/components/camera/UploadIndicator";
import { UploadsDisabledScreen } from "@/components/camera/UploadsDisabledScreen";
import { FILTERS, SEGMENTS } from "@/lib/constants";
import { getFilterCss } from "@/lib/image-utils";
import { canGuestUpload } from "@/lib/photo-limits";
import {
  addUpload,
  getAllUploadsForQuota,
  getEvent,
  replaceUpload,
} from "@/lib/store";
import type { AfterUploadBehavior, CameraFilter, EventSegment, Guest } from "@/types";
import {
  Camera,
  FlipHorizontal,
  FolderOpen,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import Link from "next/link";

interface WeddingCameraProps {
  eventId: string;
  guest: Guest;
  replaceUploadId?: string;
  onNavigate?: (destination: "gallery" | "home" | "my-uploads") => void;
  onLimitBack?: () => void;
}

const IOS_CAMERA_RELEASE_MS = 150;

export function WeddingCamera({
  eventId,
  guest,
  replaceUploadId,
  onNavigate,
  onLimitBack,
}: WeddingCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startingRef = useRef(false);

  const [active, setActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [filter, setFilter] = useState<CameraFilter>("warm-wedding");
  const [segment, setSegment] = useState<EventSegment>("ceremony");
  const [captured, setCaptured] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const [recording, setRecording] = useState(false);
  const [uploadTick, setUploadTick] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPostUploadPrompt, setShowPostUploadPrompt] = useState(false);
  const [lastUploadedMedia, setLastUploadedMedia] = useState<{
    data: string;
    isVideo: boolean;
  } | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const event = getEvent(eventId);
  const guestName = `${guest.firstName} ${guest.lastName}`;
  const photoMgmt = event?.photoManagement;
  const isReplaceMode = Boolean(replaceUploadId && photoMgmt?.replaceUploadedPhotos);
  const showingPreview = Boolean(captured && photoMgmt);

  const uploads = useMemo(
    () => getAllUploadsForQuota(eventId),
    [eventId, uploadTick]
  );

  const uploadCheck = useMemo(
    () =>
      canGuestUpload(
        event?.photoLimits ?? {
          enabled: false,
          type: "total",
          maxPhotos: 10,
          limitReachedBehavior: "block",
        },
        uploads,
        guest.id,
        segment
      ),
    [event?.photoLimits, uploads, guest.id, segment]
  );

  const filterCss = getFilterCss(filter);
  const blocked =
    !isReplaceMode &&
    uploadCheck.quota.isAtLimit &&
    event?.photoLimits.limitReachedBehavior === "block" &&
    event?.photoLimits.enabled;

  const uploadsDisabled = event?.moderation.uploadsDisabled && !isReplaceMode;

  const showSuccess = useCallback((message: string) => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    setSuccessMessage(message);
    successTimerRef.current = setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setActive(false);
  }, []);

  const attachStream = useCallback(async (stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return false;

    streamRef.current = stream;
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    try {
      await video.play();
      setActive(true);
      return true;
    } catch {
      setActive(false);
      return false;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (startingRef.current || blocked || showingPreview) return;
    startingRef.current = true;

    try {
      stopStream();
      await new Promise((resolve) => setTimeout(resolve, IOS_CAMERA_RELEASE_MS));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: mode === "video",
      });

      const attached = await attachStream(stream);
      if (!attached) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    } catch {
      setActive(false);
      alert("Camera access is required to capture wedding moments.");
    } finally {
      startingRef.current = false;
    }
  }, [attachStream, blocked, facingMode, mode, showingPreview, stopStream]);

  useEffect(() => {
    if (blocked || showingPreview) {
      stopStream();
      return;
    }

    void startCamera();
    return () => {
      stopStream();
    };
  }, [blocked, facingMode, mode, showingPreview, startCamera, stopStream]);

  const handleAfterUpload = useCallback(
    (behavior: AfterUploadBehavior) => {
      if (isReplaceMode) {
        onNavigate?.("my-uploads");
        return;
      }

      switch (behavior) {
        case "go-to-gallery":
          onNavigate?.("gallery");
          break;
        case "ask-user":
          setShowPostUploadPrompt(true);
          break;
        case "stay-in-camera":
        default:
          showSuccess("Photo uploaded successfully.");
          break;
      }
    },
    [isReplaceMode, onNavigate, showSuccess]
  );

  const capturePhoto = () => {
    if (!isReplaceMode && !uploadCheck.allowed && !uploadCheck.markAsExtra) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.filter = filterCss;
    ctx.drawImage(video, 0, 0);
    stopStream();
    setCaptured(canvas.toDataURL("image/jpeg", 0.92));
  };

  const startRecording = () => {
    if (!isReplaceMode && !uploadCheck.allowed && !uploadCheck.markAsExtra) return;
    if (!streamRef.current) return;

    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const reader = new FileReader();
      reader.onload = () => {
        stopStream();
        setCaptured(reader.result as string);
      };
      reader.readAsDataURL(blob);
    };
    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleCapture = () => {
    if (mode === "photo") capturePhoto();
    else if (recording) stopRecording();
    else startRecording();
  };

  const upload = async () => {
    if (!captured) return;
    setUploading(true);

    if (isReplaceMode && replaceUploadId) {
      replaceUpload(replaceUploadId, guest.id, {
        imageData: captured,
        caption: caption || undefined,
        filter,
        segment,
        isVideo: mode === "video",
      });
    } else {
      addUpload({
        eventId,
        guestId: guest.id,
        guestName,
        imageData: captured,
        caption: caption || undefined,
        segment,
        filter,
        isVideo: mode === "video",
        isExtra: uploadCheck.markAsExtra,
      });
    }

    setLastUploadedMedia({ data: captured, isVideo: mode === "video" });

    setUploading(false);
    setCaption("");
    setUploadTick((t) => t + 1);
    setCaptured(null);

    const behavior = photoMgmt?.afterUploadBehavior ?? "stay-in-camera";

    if (isReplaceMode) {
      showSuccess("Photo replaced successfully.");
      onNavigate?.("my-uploads");
      return;
    }

    handleAfterUpload(behavior);
  };

  const retake = () => {
    setCaption("");
    setCaptured(null);
  };

  const discardPreview = () => {
    setCaption("");
    setCaptured(null);
    if (isReplaceMode && onLimitBack) {
      onLimitBack();
    }
  };

  if (uploadsDisabled) {
    return <UploadsDisabledScreen onBack={onLimitBack} />;
  }

  if (blocked) {
    return (
      <LimitReachedScreen
        eventId={eventId}
        guestName={guestName}
        quota={uploadCheck.quota}
        maxPhotos={event?.photoLimits.maxPhotos}
        onBack={onLimitBack}
      />
    );
  }

  return (
    <div
      className="relative flex flex-col h-full h-screen-safe min-h-0"
      style={{ background: event?.theme.screenBackgrounds.camera ?? "#0A0A0A" }}
    >
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative flex-1 flex flex-col min-h-0">
        {isReplaceMode && !showingPreview && (
          <div className="px-4 py-2 bg-champagne/20 text-center text-xs text-ivory shrink-0">
            Replacing photo — count stays the same
          </div>
        )}

        <div className="relative flex-1 overflow-hidden min-h-0">
          {successMessage && <CameraSuccessToast message={successMessage} />}
          {showPostUploadPrompt && lastUploadedMedia && (
            <PostUploadPrompt
              imageData={lastUploadedMedia.data}
              filename={`${guestName.replace(/\s+/g, "-")}-POV.jpg`}
              title={`${guestName}'s POV`}
              isVideo={lastUploadedMedia.isVideo}
              onContinueCamera={() => {
                setShowPostUploadPrompt(false);
                setLastUploadedMedia(null);
                showSuccess("Photo uploaded successfully.");
              }}
              onViewGallery={() => {
                setShowPostUploadPrompt(false);
                setLastUploadedMedia(null);
                onNavigate?.("gallery");
              }}
            />
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${
              showingPreview ? "invisible pointer-events-none" : ""
            }`}
            style={{ filter: filterCss }}
          />

          {!active && !showingPreview && (
            <div className="absolute inset-0 flex items-center justify-center bg-charcoal">
              <Camera className="w-12 h-12 text-champagne animate-pulse" />
            </div>
          )}

          {!showingPreview && (
            <div className="absolute top-4 left-4 right-4 space-y-2 z-10">
              <div className="flex justify-between items-start gap-2">
                {!isReplaceMode ? (
                  <UploadIndicator guestName={guestName} quota={uploadCheck.quota} compact />
                ) : (
                  <span className="text-xs text-ivory/70 px-3 py-2 rounded-full bg-black/40">
                    Replace mode
                  </span>
                )}
                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/event/${eventId}/my-uploads`}
                    className="p-2.5 rounded-full bg-black/40 text-ivory backdrop-blur-sm"
                  >
                    <FolderOpen className="w-5 h-5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      setFacingMode((f) => (f === "user" ? "environment" : "user"))
                    }
                    className="p-2.5 rounded-full bg-black/40 text-ivory backdrop-blur-sm"
                  >
                    <FlipHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {showingPreview && photoMgmt && (
            <div className="absolute inset-0 z-20">
              <PhotoPreviewScreen
                guest={guest}
                imageData={captured!}
                isVideo={mode === "video"}
                filter={filter}
                caption={caption}
                markAsExtra={uploadCheck.markAsExtra}
                replaceMode={isReplaceMode}
                settings={photoMgmt}
                uploading={uploading}
                onFilterChange={setFilter}
                onCaptionChange={setCaption}
                onImageChange={setCaptured}
                onRetake={retake}
                onDelete={discardPreview}
                onUpload={upload}
              />
            </div>
          )}
        </div>

        {!showingPreview && (
          <>
            <div className="px-3 py-2 bg-black/60 touch-scroll-x shrink-0">
              <div className="flex gap-2 min-w-max">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFilter(f.value)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      filter === f.value
                        ? "bg-champagne text-white"
                        : "bg-white/10 text-ivory/80"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-3 sm:px-4 py-3 sm:py-4 bg-charcoal safe-bottom space-y-2 sm:space-y-3 shrink-0">
              <Select
                options={SEGMENTS.map((s) => ({ value: s.value, label: s.label }))}
                value={segment}
                onChange={(e) => setSegment(e.target.value as EventSegment)}
                className="w-full py-2 text-sm bg-white/10 text-ivory border-white/10 rounded-xl"
              />
              <div className="flex items-center justify-center gap-4 sm:gap-6">
                <button
                  type="button"
                  onClick={() => setMode("photo")}
                  className={`p-2 rounded-full touch-target ${mode === "photo" ? "text-champagne" : "text-ivory/50"}`}
                >
                  <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleCapture}
                  className={`rounded-full border-4 flex items-center justify-center active:scale-95 transition-transform touch-target w-16 h-16 sm:w-[72px] sm:h-[72px] ${
                    recording ? "border-red-500 bg-red-500/20" : "border-ivory bg-white/10"
                  }`}
                >
                  <div
                    className={`rounded-full ${
                      recording
                        ? "w-5 h-5 sm:w-6 sm:h-6 bg-red-500"
                        : mode === "video"
                          ? "w-7 h-7 sm:w-8 sm:h-8 bg-red-500"
                          : "w-12 h-12 sm:w-14 sm:h-14 bg-ivory"
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setMode("video")}
                  className={`p-2 rounded-full touch-target ${mode === "video" ? "text-champagne" : "text-ivory/50"}`}
                >
                  <Video className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
