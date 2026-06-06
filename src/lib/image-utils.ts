import { FILTERS } from "@/lib/constants";
import type { CameraFilter } from "@/types";

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
      resolve(canvas.toDataURL("image/jpeg", 0.92));
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
      resolve(canvas.toDataURL("image/jpeg", 0.92));
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

export async function downloadImage(imageData: string, filename: string): Promise<void> {
  const link = document.createElement("a");
  link.href = imageData;
  link.download = filename;
  link.click();
}

export async function shareImage(imageData: string, title: string): Promise<boolean> {
  if (!navigator.share) return false;
  try {
    const res = await fetch(imageData);
    const blob = await res.blob();
    const file = new File([blob], "wedding-pov.jpg", { type: blob.type });
    await navigator.share({ title, files: [file] });
    return true;
  } catch {
    return false;
  }
}
