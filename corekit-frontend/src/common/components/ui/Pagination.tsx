"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/common/utils/cn";

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  const makeRange = () => {
    const out: Array<number | "…"> = [];
    const window = 1;
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - page) <= window) {
        out.push(p);
      } else if (out[out.length - 1] !== "…") {
        out.push("…");
      }
    }
    return out;
  };

  return (
    <div className="flex items-center justify-between gap-2 text-sm text-muted pt-4">
      <p>
        {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-card-border text-foreground disabled:opacity-40 hover:bg-card-border/30"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {makeRange().map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-2 text-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                "h-8 min-w-[2rem] px-2 rounded-lg text-sm font-semibold",
                p === page
                  ? "bg-accent text-white"
                  : "text-foreground hover:bg-card-border/30 border border-card-border",
              )}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-card-border text-foreground disabled:opacity-40 hover:bg-card-border/30"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
