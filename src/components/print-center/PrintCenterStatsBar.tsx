"use client";

import { Camera, Clock, Printer, Star } from "lucide-react";
import type { PrintCenterStats } from "@/types/print-center";
import { motion } from "framer-motion";

const cards = [
  { key: "uploads", label: "Uploaded Today", icon: Camera, color: "from-champagne/20 to-blush/40" },
  { key: "printed", label: "Printed Today", icon: Printer, color: "from-emerald-50 to-teal-50" },
  { key: "favorites", label: "Favorites", icon: Star, color: "from-amber-50 to-orange-50" },
  { key: "pending", label: "Pending Queue", icon: Clock, color: "from-violet-50 to-purple-50" },
] as const;

export function PrintCenterStatsBar({
  stats,
  loading,
}: {
  stats: PrintCenterStats;
  loading?: boolean;
}) {
  const values: Record<string, number> = {
    uploads: stats.photosUploadedToday,
    printed: stats.photosPrintedToday,
    favorites: stats.favoriteCount,
    pending: stats.pendingQueueCount,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`rounded-2xl bg-gradient-to-br ${card.color} border border-white/80 p-4 md:p-5 luxury-shadow`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-warm-gray font-medium">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl md:text-3xl font-serif text-charcoal tabular-nums">
                  {loading ? "—" : values[card.key]}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-white/70">
                <Icon className="w-5 h-5 text-champagne" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
