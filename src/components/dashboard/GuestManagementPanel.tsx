"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getGuestUploadQuota } from "@/lib/photo-limits";
import {
  getAllUploadsForQuota,
  getGuests,
  removeGuest,
  resetGuestUploadCount,
  updateGuest,
} from "@/lib/store";
import { formatGuestPOV } from "@/lib/utils";
import type { WeddingEvent } from "@/types";
import { RefreshCw, Trash2, Users } from "lucide-react";

interface GuestManagementPanelProps {
  event: WeddingEvent;
  onRefresh: () => void;
}

export function GuestManagementPanel({ event, onRefresh }: GuestManagementPanelProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const guests = useMemo(() => getGuests(event.id), [event.id, refreshKey]);

  const guestRows = useMemo(() => {
    const uploads = getAllUploadsForQuota(event.id);
    const limits = event.photoLimits;

    return guests.map((guest) => {
      const quota = getGuestUploadQuota(limits, uploads, guest.id);
      return { guest, quota };
    });
  }, [event.id, event.photoLimits, guests, refreshKey]);

  const refresh = () => {
    setRefreshKey((k) => k + 1);
    onRefresh();
  };

  const startEdit = (guestId: string) => {
    const guest = guests.find((g) => g.id === guestId);
    if (!guest) return;
    setEditingId(guestId);
    setFirstName(guest.firstName);
    setLastName(guest.lastName);
  };

  const saveEdit = () => {
    if (!editingId) return;
    if (updateGuest(editingId, event.id, { firstName, lastName })) {
      setEditingId(null);
      refresh();
    }
  };

  return (
    <section className="p-4 rounded-2xl bg-white wedding-shadow border border-champagne/10 space-y-4">
      <div>
        <h3 className="font-medium flex items-center gap-2">
          <Users className="w-4 h-4 text-champagne" />
          Guest Management
        </h3>
        <p className="text-xs text-warm-gray mt-1">
          View guests, edit names, remove guests, or reset upload counts.
        </p>
      </div>

      {guestRows.length === 0 ? (
        <p className="text-sm text-warm-gray">No guests have joined yet.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {guestRows.map(({ guest, quota }) => (
            <div
              key={guest.id}
              className="p-3 rounded-xl bg-blush/30 border border-champagne/10 space-y-2"
            >
              {editingId === guest.id ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    label="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <Input
                    label="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  <div className="sm:col-span-2 flex gap-2">
                    <Button variant="gold" size="sm" onClick={saveEdit}>
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{formatGuestPOV(guest)}</p>
                      <p className="text-xs text-warm-gray mt-0.5">
                        {quota.max === null
                          ? `${quota.used} uploads`
                          : `${quota.used} / ${quota.max} uploads · ${quota.remaining ?? 0} remaining`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => startEdit(guest.id)}>
                      Edit Name
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (
                          confirm(
                            `Reset upload count for ${guest.firstName}? This deletes all their photos.`
                          )
                        ) {
                          resetGuestUploadCount(guest.id, event.id);
                          refresh();
                        }
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reset Uploads
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => {
                        if (
                          confirm(
                            `Remove ${guest.firstName} ${guest.lastName}? Their photos will be deleted.`
                          )
                        ) {
                          removeGuest(guest.id, event.id);
                          refresh();
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
