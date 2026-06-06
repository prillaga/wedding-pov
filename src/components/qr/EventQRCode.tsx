"use client";

import { useCallback, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/Button";
import { getEventJoinUrl, getEventShortCode } from "@/lib/event-utils";
import { getEvent } from "@/lib/store";
import { Copy, Download, Link2, Printer, Share2 } from "lucide-react";

interface EventQRCodeProps {
  eventId: string;
  coupleName: string;
  size?: number;
  showActions?: boolean;
  compact?: boolean;
}

async function svgToPngBlob(svg: SVGSVGElement): Promise<Blob | null> {
  const svgData = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(null);
        return;
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(blob), "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function EventQRCode({
  eventId,
  coupleName,
  size = 200,
  showActions = true,
  compact = false,
}: EventQRCodeProps) {
  const svgRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const joinUrl = getEventJoinUrl(eventId);
  const event = getEvent(eventId);
  const shortCode = event ? getEventShortCode(event.settings) : eventId.slice(0, 6).toUpperCase();
  const displayLink = joinUrl.replace(/^https?:\/\//, "");

  const getSvg = useCallback(() => {
    const svg = svgRef.current?.querySelector("svg");
    return svg instanceof SVGSVGElement ? svg : null;
  }, []);

  const handleDownload = async () => {
    const svg = getSvg();
    if (!svg) return;
    const blob = await svgToPngBlob(svg);
    if (blob) triggerDownload(blob, `${eventId}-qr-code.png`);
  };

  const handlePrint = async () => {
    const svg = getSvg();
    if (!svg) return;
    const blob = await svgToPngBlob(svg);
    if (!blob) return;
    const imgUrl = URL.createObjectURL(blob);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>${coupleName} — QR Code</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:Georgia,serif;text-align:center;padding:2rem">
        <h1 style="font-size:1.5rem;margin-bottom:0.5rem">${coupleName}</h1>
        <p style="color:#666;margin-bottom:1.5rem">Scan to join the wedding</p>
        <img src="${imgUrl}" alt="QR Code" style="width:280px;height:280px" />
        <p style="margin-top:1.5rem;font-size:0.9rem;color:#888">${displayLink}</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      URL.revokeObjectURL(imgUrl);
    };
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${coupleName} Wedding`,
        text: `Join ${coupleName}'s wedding on Wedding POV`,
        url: joinUrl,
      });
    } else {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${compact ? "" : "w-full"}`}>
      <div ref={svgRef} data-qr-root className="p-4 bg-white rounded-2xl wedding-shadow">
        <QRCodeSVG
          value={joinUrl}
          size={size}
          level="H"
          fgColor="#2C2C2C"
          bgColor="#FFFFFF"
          imageSettings={{
            src: "/icon.svg",
            height: 40,
            width: 40,
            excavate: true,
          }}
        />
      </div>

      <div className="text-center w-full">
        <p className="font-serif text-lg text-charcoal">{coupleName}</p>
        <p className="text-xs text-warm-gray mt-1">Scan to join the wedding</p>

        {!compact && (
          <div className="mt-4 space-y-2 text-left rounded-xl bg-blush/30 p-3 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-warm-gray">Event ID</p>
              <p className="font-mono text-champagne font-medium">{shortCode}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-warm-gray">Event Link</p>
              <p className="font-mono text-xs break-all text-charcoal">{displayLink}</p>
            </div>
          </div>
        )}
      </div>

      {showActions && (
        <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
          <Button variant="secondary" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4" /> Download QR
          </Button>
          <Button variant="secondary" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Print QR
          </Button>
          <Button variant="secondary" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <Button variant="gold" size="sm" onClick={handleCopyLink}>
            <Copy className="w-4 h-4" /> {copied ? "Copied!" : "Copy Link"}
          </Button>
        </div>
      )}

      {compact && (
        <button
          type="button"
          onClick={handleCopyLink}
          className="text-xs text-champagne hover:underline flex items-center gap-1"
        >
          <Link2 className="w-3 h-3" />
          {copied ? "Link copied" : "Copy event link"}
        </button>
      )}
    </div>
  );
}
