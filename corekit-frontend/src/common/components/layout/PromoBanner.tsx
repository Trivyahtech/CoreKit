"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

const KEY = "corekit:promo-dismissed";

export function PromoBanner({
  message = "Free shipping over ₹999 · 30% off your first NCC Book with code CADET30",
}: {
  message?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(KEY);
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Promotional banner"
      className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3 text-sm font-medium">
        <Sparkles className="h-4 w-4 shrink-0 animate-pulse" />
        <p className="flex-1 truncate">{message}</p>
        <button
          onClick={dismiss}
          className="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-white/10"
          aria-label="Dismiss promo"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
