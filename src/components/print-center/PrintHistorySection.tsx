"use client";

import type { PrintHistoryFilter, PrintHistoryItem } from "@/types/print-center";

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PrintHistorySection({
  items,
  filter,
  onFilterChange,
  loading,
}: {
  items: PrintHistoryItem[];
  filter: PrintHistoryFilter;
  onFilterChange: (f: PrintHistoryFilter) => void;
  loading?: boolean;
}) {
  const filters: { id: PrintHistoryFilter; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "all", label: "All" },
  ];

  return (
    <section className="rounded-3xl border border-blush/80 bg-white/60 p-5 md:p-6 luxury-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h2 className="font-serif text-xl md:text-2xl text-charcoal">Print History</h2>
          <p className="text-sm text-warm-gray mt-1">Recently printed guest photos</p>
        </div>
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterChange(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === f.id
                  ? "bg-charcoal text-ivory"
                  : "bg-blush/40 text-warm-gray hover:bg-blush"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-blush/30 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-warm-gray py-8 text-center">No prints yet for this period.</p>
      ) : (
        <ul className="divide-y divide-blush/60">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-blush flex-shrink-0">
                {item.photo?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.photo.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal truncate">
                  {item.photo?.eventName ?? item.eventId}
                </p>
                <p className="text-xs text-warm-gray">
                  {item.photo?.guestName ?? "Guest"} · Printed by{" "}
                  {item.printedBy ?? "Admin"}
                </p>
              </div>
              <time className="text-xs text-warm-gray whitespace-nowrap">
                {formatTime(item.printedAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
