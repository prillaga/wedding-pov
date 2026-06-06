"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { parseEventCodeInput } from "@/lib/event-utils";
import { Camera, X } from "lucide-react";

interface QRScannerProps {
  onScan: (raw: string) => void;
  onClose?: () => void;
}

type ScannerInstance = {
  stop: () => Promise<void>;
  getState: () => number;
};

type Html5QrcodeModule = typeof import("html5-qrcode");

/** html5-qrcode: 2 = SCANNING, 3 = PAUSED */
const SCANNER_ACTIVE_STATES = new Set([2, 3]);

async function safeStopScanner(scanner: ScannerInstance | null): Promise<void> {
  if (!scanner) return;
  try {
    const state = scanner.getState();
    if (SCANNER_ACTIVE_STATES.has(state)) {
      await scanner.stop();
    }
  } catch {
    // Scanner already stopped or never started
  }
}

function extractEventId(decoded: string): string | null {
  const parsed = parseEventCodeInput(decoded);
  return parsed || null;
}

function responsiveQrBox(viewfinderWidth: number, viewfinderHeight: number) {
  const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.75);
  return { width: Math.max(180, edge), height: Math.max(180, edge) };
}

async function startBestCamera(
  Html5Qrcode: Html5QrcodeModule["Html5Qrcode"],
  scanner: ScannerInstance & { start: Html5QrcodeModule["Html5Qrcode"]["prototype"]["start"] },
  onSuccess: (decoded: string) => void
): Promise<void> {
  const config = {
    fps: 10,
    qrbox: responsiveQrBox,
    aspectRatio: 1,
    disableFlip: false,
  };

  const onFailure = () => {};

  try {
    await scanner.start({ facingMode: "environment" }, config, onSuccess, onFailure);
    return;
  } catch {
    // Fall through — try enumerated cameras (iOS / older Android)
  }

  const devices = await Html5Qrcode.getCameras();
  if (devices.length === 0) {
    throw new Error("No camera found");
  }

  const backCamera =
    devices.find((d) => /back|rear|environment|trás|arrière/i.test(d.label)) ??
    devices[devices.length - 1];

  await scanner.start(backCamera.id, config, onSuccess, onFailure);
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanHint, setScanHint] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<ScannerInstance | null>(null);
  const onScanRef = useRef(onScan);
  const containerId = "qr-reader";

  onScanRef.current = onScan;

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    await safeStopScanner(scanner);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted) return;

        await stopScanner();

        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        await startBestCamera(Html5Qrcode, scanner, (decoded) => {
          const eventId = extractEventId(decoded);
          if (!eventId) {
            setScanHint("That QR code is not a wedding invitation. Ask your host for the printed QR.");
            return;
          }
          setScanHint(null);
          void (async () => {
            await safeStopScanner(scanner);
            scannerRef.current = null;
            setScanning(false);
            onScanRef.current(decoded);
          })();
        });

        if (!mounted) {
          await safeStopScanner(scanner);
          return;
        }

        setScanning(true);
        setError(null);
      } catch {
        if (mounted) {
          scannerRef.current = null;
          setScanning(false);
          setError(
            "Camera access is unavailable here. Open your phone's Camera app and scan the printed invitation QR code instead."
          );
        }
      }
    }

    void startScanner();

    return () => {
      mounted = false;
      void stopScanner();
    };
  }, [stopScanner]);

  const closeScanner = () => {
    void stopScanner().then(() => onClose?.());
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/95 flex flex-col safe-top safe-bottom safe-x h-screen-safe">
      <div className="flex items-center justify-between p-3 sm:p-4 shrink-0">
        <div className="flex items-center gap-2 text-ivory min-w-0">
          <Camera className="w-5 h-5 text-champagne shrink-0" />
          <span className="font-medium text-sm sm:text-base truncate">Scan Invitation QR</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={closeScanner}
            className="p-2 rounded-full bg-white/10 text-ivory hover:bg-white/20"
            aria-label="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 min-h-0 overflow-y-auto touch-scroll-y pb-4">
        {error ? (
          <div className="w-full max-w-sm space-y-4 text-center">
            <p className="text-ivory/80 text-sm leading-relaxed">{error}</p>
            <Button variant="gold" className="w-full" onClick={closeScanner}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <div id={containerId} className="w-full max-w-sm rounded-2xl overflow-hidden min-h-[260px]" />
            {scanning && (
              <p className="text-ivory/60 text-sm mt-6 text-center px-4 leading-relaxed">
                Point at the QR code on your invitation. You can also scan it with your phone&apos;s
                Camera app.
              </p>
            )}
            {scanHint && <p className="text-amber-200 text-sm mt-4 text-center px-4">{scanHint}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export default QRScanner;
