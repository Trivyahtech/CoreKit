"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Package,
  ShieldAlert,
} from "lucide-react";
import { api, ApiError } from "@/platform/api/client";

async function openAdminInvoice(orderId: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const base = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
  const res = await fetch(`${base}/orders/${orderId}/invoice`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return;
  const html = await res.text();
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
import { AdminPageHeader } from "@/common/components/layout/AdminPageHeader";
import { Badge, StatusBadge } from "@/common/components/ui/Badge";
import { Button } from "@/common/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/common/components/ui/Card";
import { Textarea, Switch } from "@/common/components/ui/FormControls";
import { formatPrice } from "@/common/components/ui/Price";
import {
  ErrorState,
  PageLoader,
} from "@/common/components/ui/States";
import { useToast } from "@/common/components/ui/Toast";
import { useConfirm } from "@/common/components/ui/ConfirmDialog";
import {
  getAllowedTransitions,
  isTerminal,
  describeTransition,
  formatStatus,
  type OrderStatus,
  type PaymentStatus,
  type TransitionRule,
} from "@/modules/core/orders/state-machine";
import { cn } from "@/common/utils/cn";

type Order = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: string;
  taxAmount: string;
  shippingAmount: string;
  discountAmount: string;
  grandTotal: string;
  customerNote?: string | null;
  user?: { firstName?: string; lastName?: string; email?: string } | null;
  items: Array<{
    id: string;
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: string;
    totalAmount: string;
  }>;
  statusLogs: Array<{
    id: string;
    toStatus: string;
    note?: string | null;
    createdAt: string;
  }>;
  payments?: Array<{ method: string; status: string }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [target, setTarget] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  const [allowDeviation, setAllowDeviation] = useState(false);
  const [deviationAck, setDeviationAck] = useState(false);

  const {
    data: order,
    isLoading,
    isError,
    refetch,
  } = useQuery<Order>({
    queryKey: ["admin-order", orderId],
    queryFn: () => api.get(`/orders/${orderId}`),
    enabled: !!orderId,
  });

  const transitions: TransitionRule[] = useMemo(() => {
    if (!order) return [];
    return getAllowedTransitions(order.status, {
      paymentStatus: order.paymentStatus,
      allowDeviation,
    });
  }, [order, allowDeviation]);

  const chosen = transitions.find((t) => t.to === target);

  const terminal = order ? isTerminal(order.status) : false;

  const canSubmit = useMemo(() => {
    if (!order || !chosen) return false;
    if (chosen.disabled) return false;
    if (chosen.requiresNote && note.trim().length < 1) return false;
    if (chosen.requiresDeviation) {
      if (!deviationAck) return false;
      if (note.trim().length < 10) return false;
    }
    return true;
  }, [order, chosen, note, deviationAck]);

  const update = useMutation({
    mutationFn: () =>
      api.patch(`/orders/${orderId}/status`, {
        status: target,
        note: note.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-order", orderId] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({
        variant: "success",
        title: `Status updated to ${formatStatus(target as OrderStatus)}`,
      });
      setNote("");
      setTarget("");
      setAllowDeviation(false);
      setDeviationAck(false);
    },
    onError: (err) => {
      toast({
        variant: "error",
        title: "Couldn't update status",
        description: err instanceof ApiError ? err.message : undefined,
      });
    },
  });

  const submit = async () => {
    if (!order || !chosen) return;
    const ok = await confirm({
      title: chosen.requiresDeviation
        ? "Confirm deviation"
        : `Confirm ${describeTransition(order.status, chosen.to)}`,
      description: chosen.requiresDeviation
        ? `You are reversing a normally irreversible step (${describeTransition(
            order.status,
            chosen.to,
          )}). This will be recorded in the audit log. Continue?`
        : chosen.destructive
        ? `${describeTransition(
            order.status,
            chosen.to,
          )} is a one-way change. It cannot be undone without a deviation approval. Continue?`
        : `Update this order to ${formatStatus(chosen.to)}?`,
      tone: chosen.destructive ? "danger" : "primary",
      confirmLabel: chosen.requiresDeviation
        ? "Apply deviation"
        : chosen.destructive
        ? `Yes, ${formatStatus(chosen.to)}`
        : "Update",
    });
    if (ok) update.mutate();
  };

  if (isLoading) return <PageLoader />;
  if (isError || !order)
    return <ErrorState title="Order not found" onRetry={() => refetch()} />;

  return (
    <div>
      <AdminPageHeader
        title={`Order ${order.orderNumber}`}
        description={
          order.user
            ? `${order.user.firstName ?? ""} ${order.user.lastName ?? ""} · ${order.user.email ?? ""} · Placed ${new Date(order.createdAt).toLocaleString()}`
            : `Placed ${new Date(order.createdAt).toLocaleString()}`
        }
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Orders", href: "/admin/orders" },
          { label: order.orderNumber },
        ]}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => openAdminInvoice(order.id)}
            >
              View invoice
            </Button>
            <Link
              href="/admin/orders"
              className="inline-flex h-10 px-3 items-center gap-1.5 rounded-lg border border-card-border bg-card-bg text-sm font-semibold hover:bg-card-border/30"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Items</h2>
              <div className="flex items-center gap-2">
                <StatusBadge status={order.status} kind="order" />
                <StatusBadge status={order.paymentStatus} kind="payment" />
              </div>
            </CardHeader>
            <ul className="divide-y divide-card-border">
              {order.items.map((it) => (
                <li key={it.id} className="flex gap-4 p-5">
                  <div className="h-14 w-14 rounded-lg border border-card-border bg-background flex items-center justify-center shrink-0">
                    <Package className="h-6 w-6 text-muted/40" />
                  </div>
                  <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {it.productName}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {it.variantName} · {formatPrice(it.unitPrice)} × {it.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground whitespace-nowrap">
                      {formatPrice(it.totalAmount)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Status history
              </h2>
            </CardHeader>
            <CardBody>
              {order.statusLogs.length === 0 ? (
                <p className="text-sm text-muted">No status changes yet.</p>
              ) : (
                <ol className="space-y-3">
                  {order.statusLogs.map((log) => (
                    <li key={log.id} className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          <Badge tone="accent" size="sm">
                            {log.toStatus}
                          </Badge>
                          <span className="ml-2 text-xs text-muted font-normal">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </p>
                        {log.note && (
                          <p className="text-sm text-foreground/90 mt-0.5">
                            {log.note}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-accent" />
              <h2 className="text-base font-semibold text-foreground">
                Update status
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {terminal && !allowDeviation ? (
                <div className="flex items-start gap-3 bg-card-border/40 rounded-lg p-3">
                  <Lock className="h-5 w-5 text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Order is in a terminal state
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {formatStatus(order.status)} orders can only be changed by
                      enabling deviation below.
                    </p>
                  </div>
                </div>
              ) : null}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Next status
                </label>
                <div className="space-y-2">
                  {transitions.length === 0 ? (
                    <p className="text-xs text-muted">
                      No transitions available from this state.
                    </p>
                  ) : (
                    transitions.map((t) => {
                      const selected = t.to === target;
                      return (
                        <button
                          key={t.to}
                          type="button"
                          onClick={() => {
                            if (t.disabled) return;
                            setTarget(t.to);
                          }}
                          disabled={t.disabled}
                          className={cn(
                            "w-full text-left rounded-xl border-2 px-3 py-2.5 transition-colors",
                            t.disabled &&
                              "opacity-50 cursor-not-allowed border-card-border bg-card-bg",
                            !t.disabled && selected &&
                              (t.destructive
                                ? "border-danger bg-danger/5"
                                : "border-accent bg-accent/5"),
                            !t.disabled && !selected &&
                              "border-card-border bg-card-bg hover:border-accent/40",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {formatStatus(t.to)}
                            </span>
                            <div className="flex items-center gap-1">
                              {t.requiresDeviation && (
                                <Badge tone="warning" size="sm">
                                  Deviation
                                </Badge>
                              )}
                              {t.destructive && !t.requiresDeviation && (
                                <Badge tone="danger" size="sm">
                                  One-way
                                </Badge>
                              )}
                            </div>
                          </div>
                          {t.disabled && t.disabledReason && (
                            <p className="text-xs text-muted mt-0.5">
                              {t.disabledReason}
                            </p>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <Switch
                checked={allowDeviation}
                onChange={(v) => {
                  setAllowDeviation(v);
                  if (!v) setTarget("");
                }}
                label="Allow deviation (override)"
                description="Expose reverse or terminal transitions. Requires a documented reason."
              />

              {allowDeviation && (
                <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-200">
                        Deviation mode enabled
                      </p>
                      <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                        Reversing a normally irreversible step. A reason of at
                        least 10 characters is required.
                      </p>
                      <label className="mt-2 flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={deviationAck}
                          onChange={(e) => setDeviationAck(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-amber-400"
                        />
                        <span className="text-xs text-amber-900 dark:text-amber-200">
                          I take responsibility for this deviation.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {chosen && !chosen.disabled && (
                <Textarea
                  label={
                    chosen.requiresNote || chosen.requiresDeviation
                      ? "Note (required)"
                      : "Note (optional)"
                  }
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={chosen.noteHint || "Visible to the customer in the order timeline"}
                />
              )}

              <Button
                fullWidth
                loading={update.isPending}
                disabled={!canSubmit}
                onClick={submit}
                variant={chosen?.destructive ? "danger" : "primary"}
              >
                {chosen
                  ? `Apply: ${describeTransition(order.status, chosen.to)}`
                  : "Select a status"}
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Totals
              </h2>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="text-foreground">{formatPrice(order.subtotal)}</dd>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Discount</dt>
                  <dd className="text-emerald-600 dark:text-emerald-400">
                    −{formatPrice(order.discountAmount)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Tax</dt>
                <dd className="text-foreground">{formatPrice(order.taxAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="text-foreground">{formatPrice(order.shippingAmount)}</dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-card-border text-base">
                <dt className="font-semibold text-foreground">Total</dt>
                <dd className="font-bold text-foreground">
                  {formatPrice(order.grandTotal)}
                </dd>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Ship to
              </h2>
            </CardHeader>
            <CardBody>
              <address className="not-italic text-sm text-foreground/90 space-y-0.5">
                <p className="font-semibold text-foreground">
                  {order.shippingAddress.fullName}
                </p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && (
                  <p>{order.shippingAddress.line2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.pincode}
                </p>
                <p className="text-muted pt-1">
                  {order.shippingAddress.phone}
                </p>
              </address>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
