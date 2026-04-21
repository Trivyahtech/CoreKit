"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="mx-auto h-20 w-20 rounded-full bg-danger/10 text-danger flex items-center justify-center">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold text-foreground">
        Something went wrong
      </h1>
      <p className="mt-2 text-muted">
        We couldn&apos;t render this page. Try again, and if the problem
        persists, contact support.
      </p>
      {error?.digest && (
        <p className="mt-2 text-xs text-muted font-mono">
          Ref: {error.digest}
        </p>
      )}
      <div className="mt-8 flex justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex h-11 px-6 items-center rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent/90"
        >
          Try again
        </button>
        <a
          href="/"
          className="inline-flex h-11 px-6 items-center rounded-full border border-card-border bg-card-bg text-sm font-semibold text-foreground hover:bg-card-border/30"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
