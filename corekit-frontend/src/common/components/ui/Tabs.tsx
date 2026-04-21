"use client";

import { cn } from "@/common/utils/cn";

export type TabItem<K extends string = string> = {
  key: K;
  label: string;
  badge?: string | number;
  icon?: React.ComponentType<{ className?: string }>;
};

export function Tabs<K extends string>({
  items,
  value,
  onChange,
  className,
  fullWidth,
}: {
  items: TabItem<K>[];
  value: K;
  onChange: (k: K) => void;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 p-1 bg-background rounded-xl border border-card-border",
        fullWidth && "w-full",
        className,
      )}
    >
      {items.map((t) => {
        const selected = t.key === value;
        const Icon = t.icon;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(t.key)}
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-colors",
              fullWidth && "flex-1 justify-center",
              selected
                ? "bg-card-bg shadow-sm text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {t.label}
            {t.badge !== undefined && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                  selected
                    ? "bg-accent/15 text-accent"
                    : "bg-card-border/60 text-muted",
                )}
              >
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
