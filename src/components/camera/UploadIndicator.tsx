"use client";

import { formatGuestNamePOV } from "@/lib/utils";
import type { GuestUploadQuota } from "@/types";

interface UploadIndicatorProps {
  guestName: string;
  quota: GuestUploadQuota;
  compact?: boolean;
}

export function UploadIndicator({ guestName, quota, compact }: UploadIndicatorProps) {
  if (!quota.isLimited || quota.max === null) return null;

  const pct = Math.min(100, (quota.used / quota.max) * 100);
  const filled = Math.round(pct / 10);

  return (
    <div
      className={`rounded-2xl border border-white/10 backdrop-blur-sm ${
        compact ? "px-3 py-2" : "px-4 py-3"
      }`}
      style={{ background: "rgba(0,0,0,0.35)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-champagne font-serif ${compact ? "text-xs" : "text-sm"} truncate`}>
            {formatGuestNamePOV(guestName)}
          </p>
          <p className={`text-ivory font-medium ${compact ? "text-xs mt-1" : "text-sm mt-1.5"}`}>
            {quota.used} / {quota.max} Photos Uploaded
          </p>
          {quota.remaining !== null && (
            <p className={`text-ivory/60 ${compact ? "text-[10px] mt-0.5" : "text-xs mt-1"}`}>
              Remaining: {quota.remaining} Photo{quota.remaining === 1 ? "" : "s"}
            </p>
          )}
        </div>
        {!compact && (
          <span className="text-ivory/80 font-mono text-sm shrink-0">
            {quota.used}/{quota.max}
          </span>
        )}
      </div>
      <div className={`${compact ? "mt-1.5" : "mt-2"} h-1.5 rounded-full bg-white/15 overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: quota.isAtLimit ? "#E8C4B8" : "var(--event-progress, var(--event-accent, #C9A962))",
          }}
        />
      </div>
      {!compact && (
        <p className="text-[10px] text-ivory/50 mt-1 font-mono tracking-wider">
          {"█".repeat(filled)}
          {"░".repeat(10 - filled)} {quota.used}/{quota.max}
        </p>
      )}
    </div>
  );
}
