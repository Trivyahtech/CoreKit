import { cn } from "@/common/utils/cn";

export function formatPrice(
  value: number | string | null | undefined,
  currency = "INR",
): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return "—";
  if (currency === "INR") {
    return `₹${num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(num);
}

export function Price({
  value,
  currency = "INR",
  compareAt,
  size = "md",
  className,
}: {
  value: number | string | null | undefined;
  currency?: string;
  compareAt?: number | string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const hasCompare =
    compareAt !== undefined &&
    compareAt !== null &&
    compareAt !== "" &&
    Number(compareAt) > Number(value);
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-2",
        size === "sm" && "text-sm",
        size === "md" && "text-base",
        size === "lg" && "text-lg",
        size === "xl" && "text-2xl",
        className,
      )}
    >
      <span className="font-bold text-foreground">{formatPrice(value, currency)}</span>
      {hasCompare && (
        <span className="text-xs text-muted line-through">
          {formatPrice(compareAt, currency)}
        </span>
      )}
    </span>
  );
}
