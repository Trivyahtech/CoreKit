export type OrderStatus =
  | "CREATED"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "CAPTURED"
  | "FAILED"
  | "REFUNDED";

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  "CREATED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
];

export const TERMINAL_STATUSES: OrderStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

/** Happy-path transitions allowed without deviation. */
const FORWARD: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED"],
  COMPLETED: ["REFUNDED"],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
};

/** Transitions that require explicit override + deviation reason. */
const REVERSIBLE_WITH_DEVIATION: Record<OrderStatus, OrderStatus[]> = {
  CREATED: [],
  CONFIRMED: ["CREATED"],
  PROCESSING: ["CONFIRMED"],
  SHIPPED: ["PROCESSING"],
  COMPLETED: [],
  CANCELLED: ["CREATED"],
  REFUNDED: [],
};

export const IRREVERSIBLE_DESTINATIONS: OrderStatus[] = [
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

export type TransitionRule = {
  to: OrderStatus;
  requiresDeviation: boolean;
  requiresNote: boolean;
  noteHint?: string;
  destructive: boolean;
  disabled?: boolean;
  disabledReason?: string;
};

export function getAllowedTransitions(
  from: OrderStatus,
  opts: {
    paymentStatus?: PaymentStatus;
    allowDeviation?: boolean;
  } = {},
): TransitionRule[] {
  const forward = FORWARD[from] ?? [];
  const reverse = REVERSIBLE_WITH_DEVIATION[from] ?? [];

  const rules: TransitionRule[] = [];

  for (const to of forward) {
    const destructive = IRREVERSIBLE_DESTINATIONS.includes(to);
    const requiresNote = to === "SHIPPED" || to === "CANCELLED" || to === "REFUNDED";
    const noteHint =
      to === "SHIPPED"
        ? "Enter tracking number or carrier details (required)"
        : to === "CANCELLED"
        ? "Explain why this order is being cancelled (required)"
        : to === "REFUNDED"
        ? "Refund reason + reference id (required)"
        : undefined;

    let disabled = false;
    let disabledReason: string | undefined;
    if (to === "REFUNDED" && opts.paymentStatus !== "CAPTURED") {
      disabled = true;
      disabledReason = "Only captured payments can be refunded";
    }

    rules.push({
      to,
      requiresDeviation: false,
      requiresNote,
      noteHint,
      destructive,
      disabled,
      disabledReason,
    });
  }

  if (opts.allowDeviation) {
    for (const to of reverse) {
      rules.push({
        to,
        requiresDeviation: true,
        requiresNote: true,
        noteHint:
          "Deviation reason — this reverses a normally-irreversible step (required, 10+ chars)",
        destructive: true,
      });
    }
  }

  return rules;
}

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function formatStatus(s: OrderStatus): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export function describeTransition(from: OrderStatus, to: OrderStatus): string {
  return `${formatStatus(from)} → ${formatStatus(to)}`;
}
