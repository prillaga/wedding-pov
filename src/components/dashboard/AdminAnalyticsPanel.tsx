"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { getApprovedUploads } from "@/lib/store";
import { formatGuestNamePOV } from "@/lib/utils";
import type { EventStats, WeddingEvent } from "@/types";
import { BarChart3, Download, Eye, Image, Users } from "lucide-react";

interface AdminAnalyticsPanelProps {
  eventId: string;
  event: WeddingEvent;
  stats: EventStats;
}

export function AdminAnalyticsPanel({ eventId, event, stats }: AdminAnalyticsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total Guests", value: stats.totalGuests, icon: <Users className="w-5 h-5" /> },
          { label: "Total Photos", value: stats.totalUploads, icon: <Image className="w-5 h-5" /> },
          {
            label: "Avg Per Guest",
            value: stats.averagePhotosPerGuest,
            icon: <BarChart3 className="w-5 h-5" />,
          },
          {
            label: "Storage Used",
            value:
              stats.storageUsedMB >= 1024
                ? `${(stats.storageUsedMB / 1024).toFixed(1)} GB`
                : `${stats.storageUsedMB.toFixed(1)} MB`,
            icon: <Download className="w-5 h-5" />,
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10"
          >
            <div className="text-champagne mb-2">{s.icon}</div>
            <p className="text-2xl font-serif font-semibold">{s.value}</p>
            <p className="text-xs text-warm-gray">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10">
        <h3 className="font-medium mb-3">Top Contributors</h3>
        <div className="space-y-2">
          {stats.topContributors.length === 0 ? (
            <p className="text-sm text-warm-gray">No uploads yet.</p>
          ) : (
            stats.topContributors.map((c) => (
              <div key={c.name} className="flex justify-between text-sm">
                <span>{formatGuestNamePOV(c.name)}</span>
                <span className="text-champagne font-medium">{c.count} Photos</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4 text-champagne" /> Most Viewed Photos
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {stats.mostViewedPhotos.length === 0 ? (
            <p className="text-sm text-warm-gray col-span-3">No photos yet.</p>
          ) : (
            stats.mostViewedPhotos.map(({ upload, views }) => (
              <div key={upload.id} className="relative rounded-xl overflow-hidden aspect-square">
                <img src={upload.imageData} alt="" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] px-1.5 py-1">
                  {views} views
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10">
        <h3 className="font-medium mb-3">Recent Uploads</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {stats.recentUploads.length === 0 ? (
            <p className="text-sm text-warm-gray">No recent uploads.</p>
          ) : (
            stats.recentUploads.map((upload) => (
              <div key={upload.id} className="flex gap-3 items-center">
                <img
                  src={upload.imageData}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{formatGuestNamePOV(upload.guestName)}</p>
                  <p className="text-[10px] text-warm-gray">
                    {new Date(upload.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white wedding-shadow text-center">
        <p className="text-sm text-warm-gray mb-3">
          Full QR management is in the <strong>QR Code</strong> tab — download, print, share, and copy
          your guest link.
        </p>
        <Link href={`/wedding/${eventId}`} className="text-sm text-champagne hover:underline">
          Preview guest page →
        </Link>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          getApprovedUploads(eventId).forEach((u, i) => {
            const link = document.createElement("a");
            link.href = u.imageData;
            link.download = `${u.guestName}-POV-${i + 1}.jpg`;
            link.click();
          });
        }}
      >
        <Download className="w-4 h-4" /> Download All Photos
      </Button>
    </div>
  );
}
