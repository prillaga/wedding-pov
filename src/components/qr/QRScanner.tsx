"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { parseEventCodeInput } from "@/lib/event-utils";
import { Camera, X } from "lucide-react";

interface QRScannerProps {
  onScan: (raw: string) => void;
  onClose?: () => void;
  onManualEntry?: (code: string) => void;
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

export function QRScanner({ onScan, onClose, onManualEntry }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanHint, setScanHint] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState("");
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
    if (manualMode) return;

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
            setScanHint("QR not recognized — use your invitation link or event code.");
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
          setError("Camera unavailable on this device. Enter your event code below.");
          setManualMode(true);
        }
      }
    }

    void startScanner();

    return () => {
      mounted = false;
      void stopScanner();
    };
  }, [manualMode, stopScanner]);

  const openManualMode = () => {
    setScanHint(null);
    void stopScanner().then(() => setManualMode(true));
  };

  const closeScanner = () => {
    void stopScanner().then(() => onClose?.());
  };

  const submitManual = () => {
    const eventId = extractEventId(manualCode);
    if (!eventId) {
      setScanHint("Enter a valid event code or paste your invitation link.");
      return;
    }
    void stopScanner().then(() => {
      if (onManualEntry) onManualEntry(manualCode);
      else onScan(manualCode);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/95 flex flex-col safe-top safe-bottom safe-x h-screen-safe">
      <div className="flex items-center justify-between p-3 sm:p-4 shrink-0">
        <div className="flex items-center gap-2 text-ivory min-w-0">
          <Camera className="w-5 h-5 text-champagne shrink-0" />
          <span className="font-medium text-sm sm:text-base truncate">
            {manualMode ? "Enter Event Code" : "Scan Invitation QR"}
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={closeScanner}
            className="p-2 rounded-full bg-white/10 text-ivory hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 min-h-0 overflow-y-auto touch-scroll-y pb-4">
        {manualMode ? (
          <div className="w-full max-w-sm space-y-4">
            {error && <p className="text-ivory/70 text-sm text-center">{error}</p>}
            {scanHint && <p className="text-amber-200 text-sm text-center">{scanHint}</p>}
            <input
              value={manualCode}
              onChange={(e) => {
                setManualCode(e.target.value);
                setScanHint(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && submitManual()}
              placeholder="Event code or invitation link"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full px-4 py-3 rounded-full border border-white/20 bg-white/10 text-ivory text-sm placeholder:text-ivory/40 focus:outline-none focus:ring-2 focus:ring-champagne/50"
            />
            <Button variant="gold" className="w-full" onClick={submitManual} disabled={!manualCode.trim()}>
              Continue
            </Button>
            {!error && (
              <button
                type="button"
                onClick={() => {
                  setManualMode(false);
                  setScanHint(null);
                }}
                className="w-full text-sm text-ivory/60 hover:text-ivory"
              >
                ← Back to QR scanner
              </button>
            )}
          </div>
        ) : (
          <>
            <div id={containerId} className="w-full max-w-sm rounded-2xl overflow-hidden min-h-[260px]" />
            {scanning && (
              <p className="text-ivory/60 text-sm mt-6 text-center px-4">
                Point your camera at the QR code. You can also scan with your phone&apos;s Camera app.
              </p>
            )}
            {scanHint && <p className="text-amber-200 text-sm mt-4 text-center px-4">{scanHint}</p>}
            <button
              type="button"
              onClick={openManualMode}
              className="mt-6 text-sm text-champagne hover:underline"
            >
              Enter code manually
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default QRScanner;
