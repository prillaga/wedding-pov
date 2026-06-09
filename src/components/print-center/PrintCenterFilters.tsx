"use client";

import type { EventCategoryFilter, PrintCenterViewFilter } from "@/types/print-center";

const EVENT_FILTERS: { id: EventCategoryFilter; label: string }[] = [
  { id: "all", label: "All Events" },
  { id: "wedding", label: "Wedding" },
  { id: "birthday", label: "Birthday" },
  { id: "graduation", label: "Graduation" },
  { id: "corporate", label: "Corporate" },
];

const VIEW_FILTERS: { id: PrintCenterViewFilter; label: string }[] = [
  { id: "all", label: "All Photos" },
  { id: "favorites", label: "⭐ Favorites" },
  { id: "pending", label: "Pending Print" },
];

export function PrintCenterFilters({
  eventCategory,
  viewFilter,
  onEventCategory,
  onViewFilter,
}: {
  eventCategory: EventCategoryFilter;
  viewFilter: PrintCenterViewFilter;
  onEventCategory: (v: EventCategoryFilter) => void;
  onViewFilter: (v: PrintCenterViewFilter) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {EVENT_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onEventCategory(f.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all touch-target ${
              eventCategory === f.id
                ? "bg-charcoal text-ivory shadow-md"
                : "bg-white/80 text-warm-gray border border-blush hover:border-champagne"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {VIEW_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onViewFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              viewFilter === f.id
                ? "bg-champagne text-white"
                : "bg-blush/50 text-warm-gray hover:bg-blush"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
