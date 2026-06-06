"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Camera, X } from "lucide-react";

interface QRScannerProps {
  onScan: (eventId: string) => void;
  onClose?: () => void;
}

function extractEventId(decoded: string): string | null {
  try {
    const url = new URL(decoded);
    const parts = url.pathname.split("/");
    const weddingIdx = parts.indexOf("wedding");
    if (weddingIdx >= 0 && parts[weddingIdx + 1]) return parts[weddingIdx + 1];
    const joinIdx = parts.indexOf("join");
    if (joinIdx >= 0 && parts[joinIdx + 1]) return parts[joinIdx + 1];
    const eventIdx = parts.indexOf("event");
    if (eventIdx >= 0 && parts[eventIdx + 1]) return parts[eventIdx + 1];
  } catch {
    if (decoded.startsWith("wedding-pov:")) return decoded.replace("wedding-pov:", "");
    if (decoded.length >= 4 && decoded.length <= 64) return decoded;
  }
  return null;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const containerId = "qr-reader";

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted) return;

        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decoded) => {
            const eventId = extractEventId(decoded);
            if (eventId) {
              scanner.stop().catch(() => {});
              onScan(eventId);
            }
          },
          () => {}
        );
        if (mounted) setScanning(true);
      } catch {
        if (mounted) {
          setError(
            "Camera access denied. Please allow camera permissions or enter the event code manually."
          );
        }
      }
    }

    startScanner();

    return () => {
      mounted = false;
      scannerRef.current?.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/95 flex flex-col safe-top safe-bottom">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 text-ivory">
          <Camera className="w-5 h-5 text-champagne" />
          <span className="font-medium">Scan Invitation QR</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 text-ivory hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {error ? (
          <div className="text-center text-ivory/80 max-w-sm">
            <p className="mb-4">{error}</p>
            <Button variant="gold" onClick={onClose}>
              Enter Code Manually
            </Button>
          </div>
        ) : (
          <>
            <div id={containerId} className="w-full max-w-sm rounded-2xl overflow-hidden" />
            {scanning && (
              <p className="text-ivory/60 text-sm mt-6 text-center">
                Point your camera at the QR code on your invitation
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
