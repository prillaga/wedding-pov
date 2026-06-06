"use client";

import Link from "next/link";
import { useEffect } from "react";
import { resetAppData } from "@/lib/store";

interface LoadingShellProps {
  message?: string;
}

export function LoadingShell({ message = "Loading..." }: LoadingShellProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const el = document.getElementById("boot-hint");
      if (el) el.classList.remove("hidden");
    }, 4000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-dvh flex items-center justify-center px-6 bg-ivory">
      <div className="text-center max-w-sm">
        <p className="text-warm-gray">{message}</p>
        <noscript>
          <p className="text-sm text-red-600 mt-4">
            JavaScript is required. Open this page in Safari or Chrome — not Cursor&apos;s preview.
          </p>
        </noscript>
        <div
          id="boot-hint"
          className="hidden mt-6 p-4 rounded-2xl bg-blush/50 text-left text-sm text-warm-gray space-y-2"
        >
          <p className="font-medium text-charcoal">Still loading?</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Use <strong>Safari</strong> or <strong>Chrome</strong> — not Cursor</li>
            <li>
              <Link href="/WeddingPOV.html" className="text-champagne underline">
                Open offline demo (works immediately)
              </Link>
            </li>
            <li>First launch can take 30 seconds while the app compiles</li>
          </ul>
          <div className="flex flex-col gap-2 mt-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-champagne underline text-left"
            >
              Reload page
            </button>
            <button
              type="button"
              onClick={() => {
                resetAppData();
                window.location.reload();
              }}
              className="text-champagne underline text-left"
            >
              Reset saved data & reload
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
