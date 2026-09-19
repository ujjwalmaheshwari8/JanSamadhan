"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base-950 px-4 text-center">
      <AlertTriangle className="h-10 w-10 text-crit" />
      <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
      <p className="max-w-sm text-sm text-base-500">An unexpected error occurred while rendering this view.</p>
      <button
        onClick={reset}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-base-950 shadow-glow hover:bg-accent-glow"
      >
        Try again
      </button>
    </div>
  );
}
