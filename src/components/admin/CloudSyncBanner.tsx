"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  fetchCloudStorageStatus,
  syncAllLocalEventsToCloud,
} from "@/lib/event-remote";
import { getManageableEvents } from "@/lib/store";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";

export function CloudSyncBanner() {
  const [message, setMessage] = useState("Checking cloud sync…");
  const [ok, setOk] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);

  const runSync = async () => {
    setSyncing(true);
    const events = getManageableEvents();
    const status = await fetchCloudStorageStatus();
    const result = await syncAllLocalEventsToCloud(events);

    if (!status.cloudConfigured) {
      setOk(false);
      setMessage(
        "Cloud storage not connected — events on this PC won't reach other phones yet. In Vercel: Storage → Create Blob Store → connect to wedding-pov, then tap Sync Now."
      );
      setSyncing(false);
      return;
    }

    if (result.failed === 0 && result.synced > 0) {
      setOk(true);
      setMessage(
        `Synced ${result.synced} event${result.synced === 1 ? "" : "s"} to cloud. Guest phones can now join with the event link or QR.`
      );
    } else if (result.synced > 0) {
      setOk(false);
      setMessage(
        `Synced ${result.synced} of ${events.length} events. ${result.lastError ?? "Some events failed to upload."}`
      );
    } else if (events.length === 0) {
      setOk(null);
      setMessage("Create a wedding event, then sync so guest phones can find it.");
    } else {
      setOk(false);
      setMessage(result.lastError ?? "Could not sync events to cloud. Try Sync Now again.");
    }
    setSyncing(false);
  };

  useEffect(() => {
    void runSync();
  }, []);

  return (
    <div
      className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-3 ${
        ok === true
          ? "bg-green-50 border-green-200"
          : ok === false
            ? "bg-amber-50 border-amber-200"
            : "bg-blush/40 border-champagne/20"
      }`}
    >
      {ok ? (
        <Cloud className="w-5 h-5 text-green-700 shrink-0" />
      ) : (
        <CloudOff className="w-5 h-5 text-amber-700 shrink-0" />
      )}
      <p className="text-sm flex-1 text-charcoal">{message}</p>
      <Button variant="secondary" size="sm" loading={syncing} onClick={() => void runSync()}>
        <RefreshCw className="w-4 h-4" /> Sync Now
      </Button>
    </div>
  );
}
