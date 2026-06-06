"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-dvh flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl font-semibold text-charcoal mb-2">Something went wrong</h1>
        <p className="text-warm-gray text-sm mb-4">{error.message || "A client error occurred."}</p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full px-6 py-3 rounded-full bg-champagne text-white font-medium"
          >
            Try again
          </button>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.removeItem("wedding-pov-events");
                localStorage.removeItem("wedding-pov-guests");
                localStorage.removeItem("wedding-pov-uploads");
                localStorage.removeItem("wedding-pov-session");
                window.location.href = "/";
              }
            }}
            className="w-full px-6 py-3 rounded-full border border-champagne/30 text-warm-gray text-sm"
          >
            Reset app data & go home
          </button>
        </div>
      </div>
    </main>
  );
}
