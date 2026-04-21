import { cn } from "@/common/utils/cn";

type Tone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  size?: "sm" | "md";
};

const tones: Record<Tone, string> = {
  neutral: "bg-card-border/40 text-foreground",
  accent: "bg-accent/10 text-accent",
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  danger: "bg-danger/10 text-danger",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

export function Badge({
  tone = "neutral",
  size = "sm",
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        tones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

const ORDER_STATUS_TONE: Record<string, Tone> = {
  CREATED: "info",
  CONFIRMED: "success",
  PROCESSING: "warning",
  SHIPPED: "info",
  COMPLETED: "success",
  CANCELLED: "danger",
  REFUNDED: "warning",
};

const PAYMENT_STATUS_TONE: Record<string, Tone> = {
  PENDING: "warning",
  AUTHORIZED: "info",
  CAPTURED: "success",
  FAILED: "danger",
  REFUNDED: "warning",
};

export function StatusBadge({
  status,
  kind = "order",
  className,
}: {
  status: string;
  kind?: "order" | "payment";
  className?: string;
}) {
  const map = kind === "payment" ? PAYMENT_STATUS_TONE : ORDER_STATUS_TONE;
  const tone: Tone = map[status] || "neutral";
  return (
    <Badge tone={tone} className={className}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
