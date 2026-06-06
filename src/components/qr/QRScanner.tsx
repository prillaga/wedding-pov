"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { parseEventCodeInput } from "@/lib/event-utils";
import { Camera, X } from "lucide-react";

interface QRScannerProps {
  onScan: (eventId: string) => void;
  onClose?: () => void;
  onManualEntry?: (code: string) => void;
}

function extractEventId(decoded: string): string | null {
  const parsed = parseEventCodeInput(decoded);
  return parsed || null;
}

type ScannerInstance = {
  stop: () => Promise<void>;
  getState: () => number;
};

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

export function QRScanner({ onScan, onClose, onManualEntry }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
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

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decoded) => {
            const eventId = extractEventId(decoded);
            if (!eventId) return;
            void (async () => {
              await safeStopScanner(scanner);
              scannerRef.current = null;
              setScanning(false);
              onScanRef.current(eventId);
            })();
          },
          () => {}
        );

        if (!mounted) {
          await safeStopScanner(scanner);
          return;
        }

        setScanning(true);
      } catch {
        if (mounted) {
          scannerRef.current = null;
          setScanning(false);
          setError("Camera access denied. Enter your event code manually below.");
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
    void stopScanner().then(() => setManualMode(true));
  };

  const closeScanner = () => {
    void stopScanner().then(() => onClose?.());
  };

  const submitManual = () => {
    const eventId = extractEventId(manualCode);
    if (!eventId) return;
    void stopScanner().then(() => {
      if (onManualEntry) onManualEntry(eventId);
      else onScan(eventId);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/95 flex flex-col safe-top safe-bottom">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 text-ivory">
          <Camera className="w-5 h-5 text-champagne" />
          <span className="font-medium">
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

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {manualMode ? (
          <div className="w-full max-w-sm space-y-4">
            {error && <p className="text-ivory/70 text-sm text-center">{error}</p>}
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitManual()}
              placeholder="Event code or invitation link"
              autoFocus
              className="w-full px-4 py-3 rounded-full border border-white/20 bg-white/10 text-ivory text-sm placeholder:text-ivory/40 focus:outline-none focus:ring-2 focus:ring-champagne/50"
            />
            <Button variant="gold" className="w-full" onClick={submitManual} disabled={!manualCode.trim()}>
              Continue
            </Button>
            {!error && (
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className="w-full text-sm text-ivory/60 hover:text-ivory"
              >
                ← Back to QR scanner
              </button>
            )}
          </div>
        ) : (
          <>
            <div id={containerId} className="w-full max-w-sm rounded-2xl overflow-hidden min-h-[250px]" />
            {scanning && (
              <p className="text-ivory/60 text-sm mt-6 text-center">
                Point your camera at the QR code on your invitation
              </p>
            )}
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
