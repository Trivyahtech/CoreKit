"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/common/utils/cn";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled,
  size = "md",
  className,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const dec = () => !disabled && onChange(Math.max(min, value - 1));
  const inc = () => !disabled && onChange(Math.min(max, value + 1));
  const sizing =
    size === "sm"
      ? "h-8 text-xs [&>button]:w-8"
      : "h-10 text-sm [&>button]:w-10";
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-card-border bg-card-bg overflow-hidden select-none",
        sizing,
        disabled && "opacity-60",
        className,
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className="flex items-center justify-center text-muted hover:text-foreground hover:bg-card-border/40 transition-colors disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-[2.25rem] text-center font-semibold text-foreground">
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        className="flex items-center justify-center text-muted hover:text-foreground hover:bg-card-border/40 transition-colors disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
