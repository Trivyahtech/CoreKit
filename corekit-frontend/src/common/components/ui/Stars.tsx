"use client";

import { Star } from "lucide-react";
import { cn } from "@/common/utils/cn";

export function Stars({
  value,
  max = 5,
  size = "md",
  onChange,
  className,
  ariaLabel,
}: {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  onChange?: (v: number) => void;
  className?: string;
  ariaLabel?: string;
}) {
  const sizing =
    size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-4 w-4";
  const interactive = typeof onChange === "function";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5",
        interactive && "cursor-pointer",
        className,
      )}
      role={interactive ? "radiogroup" : undefined}
      aria-label={ariaLabel || `${value} out of ${max} stars`}
    >
      {Array.from({ length: max }).map((_, i) => {
        const n = i + 1;
        const filled = value >= n;
        const El = interactive ? "button" : "span";
        return (
          <El
            key={n}
            type={interactive ? "button" : undefined}
            role={interactive ? "radio" : undefined}
            aria-checked={interactive ? value === n : undefined}
            onClick={interactive ? () => onChange?.(n) : undefined}
            className={cn(
              "inline-flex items-center justify-center rounded-md",
              interactive && "hover:scale-110 transition-transform",
            )}
            aria-label={interactive ? `${n} star${n > 1 ? "s" : ""}` : undefined}
          >
            <Star
              className={cn(
                sizing,
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted/40 fill-transparent",
              )}
            />
          </El>
        );
      })}
    </div>
  );
}

export function averageRating(
  reviews: Array<{ rating: number }> | null | undefined,
): number {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((a, r) => a + r.rating, 0);
  return sum / reviews.length;
}
