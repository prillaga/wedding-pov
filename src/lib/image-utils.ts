import { FILTERS } from "@/lib/constants";
import type { CameraFilter } from "@/types";

/** Max long edge for stored guest photos — keeps saves fast and within device quotas. */
export const UPLOAD_MAX_EDGE = 1280;
export const UPLOAD_JPEG_QUALITY = 0.78;

export function getFilterCss(filter: CameraFilter): string {
  return FILTERS.find((f) => f.value === filter)?.css ?? "none";
}

export function applyFilterToImage(
  imageDataUrl: string,
  filter: CameraFilter
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.filter = getFilterCss(filter);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", UPLOAD_JPEG_QUALITY));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageDataUrl;
  });
}

/** Resize and compress before saving — full phone camera JPEGs exceed mobile localStorage limits quickly. */
export function compressImageForUpload(
  imageDataUrl: string,
  maxEdge = UPLOAD_MAX_EDGE,
  quality = UPLOAD_JPEG_QUALITY
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const longEdge = Math.max(img.width, img.height);
      const scale = longEdge > maxEdge ? maxEdge / longEdge : 1;
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageDataUrl;
  });
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function cropImage(imageDataUrl: string, rect: CropRect): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
      resolve(canvas.toDataURL("image/jpeg", UPLOAD_JPEG_QUALITY));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageDataUrl;
  });
}

/** Center square crop */
export function centerSquareCrop(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;
      cropImage(imageDataUrl, { x, y, width: size, height: size })
        .then(resolve)
        .catch(reject);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageDataUrl;
  });
}

export type SaveImageMethod = "share" | "download";

export interface SaveImageResult {
  ok: boolean;
  method?: SaveImageMethod;
  cancelled?: boolean;
  error?: string;
}

async function mediaDataToFile(
  imageData: string,
  filename: string,
  fallbackType = "image/jpeg"
): Promise<File> {
  const res = await fetch(imageData);
  const blob = await res.blob();
  const type = blob.type || fallbackType;
  const hasExt = /\.(jpe?g|png|webp|gif|mp4|webm)$/i.test(filename);
  const safeName = hasExt ? filename : `${filename}.${type.includes("video") ? "webm" : "jpg"}`;
  return new File([blob], safeName, { type });
}

export function canSaveViaShareSheet(): boolean {
  if (typeof navigator === "undefined" || !navigator.share || !navigator.canShare) return false;
  try {
    const file = new File(["x"], "wedding-pov.jpg", { type: "image/jpeg" });
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export function getSavePhotoLabel(isVideo = false): string {
  if (isVideo) return canSaveViaShareSheet() ? "Save Video" : "Download Video";
  return canSaveViaShareSheet() ? "Save to Photos" : "Save Photo";
}

/** Save image/video to device — share sheet on mobile (Save to Photos), download elsewhere. */
export async function saveImageToDevice(
  imageData: string,
  filename: string,
  options?: { title?: string; isVideo?: boolean }
): Promise<SaveImageResult> {
  try {
    const file = await mediaDataToFile(
      imageData,
      filename,
      options?.isVideo ? "video/webm" : "image/jpeg"
    );

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: options?.title ?? "Wedding POV",
        files: [file],
      });
      return { ok: true, method: "share" };
    }

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
    return { ok: true, method: "download" };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, cancelled: true };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not save photo",
    };
  }
}

export async function downloadImage(imageData: string, filename: string): Promise<void> {
  await saveImageToDevice(imageData, filename);
}

export async function shareImage(imageData: string, title: string): Promise<boolean> {
  if (!navigator.share) return false;
  try {
    const file = await mediaDataToFile(imageData, "wedding-pov.jpg");
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title, files: [file] });
    } else {
      await navigator.share({ title, text: title });
    }
    return true;
  } catch {
    return false;
  }
}
