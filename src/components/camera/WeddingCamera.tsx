"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Select } from "@/components/ui/Input";
import { CameraSuccessToast } from "@/components/camera/CameraSuccessToast";
import { LimitReachedScreen } from "@/components/camera/LimitReachedScreen";
import { PhotoPreviewScreen } from "@/components/camera/PhotoPreviewScreen";
import { PostUploadPrompt } from "@/components/camera/PostUploadPrompt";
import { UploadIndicator } from "@/components/camera/UploadIndicator";
import { UploadsDisabledScreen } from "@/components/camera/UploadsDisabledScreen";
import { FILTERS, SEGMENTS, formatRecordingTime, getVideoDurationLabel } from "@/lib/constants";
import { compressImageForUpload, getFilterCss } from "@/lib/image-utils";
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
  FolderOpen,
  Image as ImageIcon,
  SwitchCamera,
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
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
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
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const event = getEvent(eventId);
  const guestName = `${guest.firstName} ${guest.lastName}`;
  const photoMgmt = event?.photoManagement;
  const maxVideoDurationMs = (event?.videoLimits?.maxDurationSeconds ?? 180) * 1000;
  const maxVideoDurationLabel = getVideoDurationLabel(
    event?.videoLimits?.maxDurationSeconds ?? 180
  );
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
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
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

  const capturePhoto = async () => {
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

    const raw = canvas.toDataURL("image/jpeg", 0.92);
    try {
      setCaptured(await compressImageForUpload(raw));
    } catch {
      setCaptured(raw);
    }
  };

  const clearRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(
    (autoStopped = false) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
        clearRecordingTimer();
        setRecording(false);
        setRecordingElapsedMs(0);
        return;
      }

      mediaRecorderRef.current.stop();
      clearRecordingTimer();
      setRecording(false);

      if (autoStopped) {
        showSuccess(`Video stopped at ${maxVideoDurationLabel} limit.`);
      }

      setRecordingElapsedMs(0);
    },
    [clearRecordingTimer, maxVideoDurationLabel, showSuccess]
  );

  const startRecording = () => {
    if (!isReplaceMode && !uploadCheck.allowed && !uploadCheck.markAsExtra) return;
    if (!streamRef.current) return;

    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const reader = new FileReader();
      reader.onload = () => {
        stopStream();
        setCaptured(reader.result as string);
      };
      reader.readAsDataURL(blob);
    };

    const startedAt = Date.now();
    setRecordingElapsedMs(0);
    clearRecordingTimer();
    recordingTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setRecordingElapsedMs(elapsed);
      if (elapsed >= maxVideoDurationMs) {
        stopRecording(true);
      }
    }, 200);

    recorder.start(1000);
    setRecording(true);
  };

  const handleCapture = () => {
    if (mode === "photo") capturePhoto();
    else if (recording) stopRecording();
    else startRecording();
  };

  const upload = async () => {
    if (!captured) return;
    setUploading(true);

    try {
      let imageData = captured;
      if (mode !== "video") {
        try {
          imageData = await compressImageForUpload(captured);
        } catch {
          imageData = captured;
        }
      }

      if (isReplaceMode && replaceUploadId) {
        const ok = await replaceUpload(replaceUploadId, guest.id, {
          imageData,
          caption: caption || undefined,
          filter,
          segment,
          isVideo: mode === "video",
        });
        if (!ok) {
          showSuccess(
            "Could not save photo. Try deleting old photos in My Uploads, then try again."
          );
          return;
        }
      } else {
        const saved = await addUpload({
          eventId,
          guestId: guest.id,
          guestName,
          imageData,
          caption: caption || undefined,
          segment,
          filter,
          isVideo: mode === "video",
          isExtra: uploadCheck.markAsExtra,
        });
        if (!saved) {
          showSuccess(
            event?.moderation.uploadsDisabled
              ? "Uploads are paused for this event."
              : "Could not save photo. Try deleting old photos in My Uploads, then try again."
          );
          return;
        }
      }

      setLastUploadedMedia({ data: imageData, isVideo: mode === "video" });
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
    } catch {
      showSuccess("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
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

          {!showingPreview && recording && mode === "video" && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-red-500/40">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-mono text-ivory tabular-nums">
                  {formatRecordingTime(recordingElapsedMs)} / {formatRecordingTime(maxVideoDurationMs)}
                </span>
              </div>
              <p className="text-[10px] text-ivory/70">Max video length: {maxVideoDurationLabel}</p>
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
                    aria-label="My uploads"
                  >
                    <FolderOpen className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {showingPreview && photoMgmt && (
            <div className="absolute inset-0 z-20 flex flex-col h-full min-h-0">
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
              <div className="flex items-end justify-center gap-3 sm:gap-5">
                <button
                  type="button"
                  onClick={() => setMode("photo")}
                  className={`flex flex-col items-center gap-1 touch-target pb-1 ${
                    mode === "photo" ? "text-champagne" : "text-ivory/50"
                  }`}
                  aria-label="Photo mode"
                >
                  <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-[10px] font-medium">Photo</span>
                </button>
                <button
                  type="button"
                  onClick={handleCapture}
                  className={`rounded-full border-4 flex items-center justify-center active:scale-95 transition-transform touch-target w-16 h-16 sm:w-[72px] sm:h-[72px] mb-1 ${
                    recording ? "border-red-500 bg-red-500/20" : "border-ivory bg-white/10"
                  }`}
                  aria-label={mode === "video" ? "Record video" : "Take photo"}
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
                  className={`flex flex-col items-center gap-1 touch-target pb-1 ${
                    mode === "video" ? "text-champagne" : "text-ivory/50"
                  }`}
                  aria-label="Video mode"
                >
                  <Video className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-[10px] font-medium">Video</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFacingMode((f) => (f === "user" ? "environment" : "user"))
                  }
                  aria-label={
                    facingMode === "user"
                      ? "Switch to back camera"
                      : "Switch to front camera"
                  }
                  title="Flip camera"
                  className="flex flex-col items-center gap-1 touch-target pb-0.5"
                >
                  <span className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-champagne/30 text-champagne ring-2 ring-champagne shadow-[0_0_12px_rgba(201,169,98,0.35)] backdrop-blur-sm active:scale-95 transition-transform">
                    <SwitchCamera className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.25} />
                  </span>
                  <span className="text-[10px] font-semibold text-champagne">
                    {facingMode === "user" ? "Back" : "Selfie"}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
