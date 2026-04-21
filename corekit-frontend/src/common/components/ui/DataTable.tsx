"use client";

import { cn } from "@/common/utils/cn";

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  width?: string;
};

export function DataTable<T extends { id?: string | number }>({
  columns,
  rows,
  keyBy,
  empty,
  compact,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  keyBy?: (row: T) => string | number;
  empty?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  if (rows.length === 0 && empty) {
    return <div className={className}>{empty}</div>;
  }

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-2xl border border-card-border",
        className,
      )}
    >
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-card-border bg-background/40">
            {columns.map((c) => (
              <th
                key={c.key}
                style={c.width ? { width: c.width } : undefined}
                className={cn(
                  "px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted",
                  c.align === "right" && "text-right",
                  c.align === "center" && "text-center",
                  !c.align && "text-left",
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border bg-card-bg">
          {rows.map((row, i) => (
            <tr
              key={keyBy ? keyBy(row) : (row.id ?? i)}
              className="hover:bg-card-border/15 transition-colors"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    compact ? "px-4 py-2" : "px-4 py-3",
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                    "text-foreground align-middle",
                    c.className,
                  )}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
