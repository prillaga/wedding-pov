"use client";

import { QRCodeSVG } from "qrcode.react";

interface EventQRCodeProps {
  eventId: string;
  coupleName: string;
  size?: number;
}

export function EventQRCode({ eventId, coupleName, size = 200 }: EventQRCodeProps) {
  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/wedding/${eventId}`
      : `/wedding/${eventId}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="p-4 bg-white rounded-2xl wedding-shadow">
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
      <div className="text-center">
        <p className="font-serif text-lg text-charcoal">{coupleName}</p>
        <p className="text-xs text-warm-gray mt-1">Scan to join the wedding</p>
        <p className="text-xs text-champagne mt-2 font-mono">{eventId}</p>
      </div>
    </div>
  );
}
