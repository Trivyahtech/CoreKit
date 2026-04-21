"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Package,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { api, ApiError } from "@/platform/api/client";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { StatusBadge } from "@/common/components/ui/Badge";
import { Button } from "@/common/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/common/components/ui/Card";
import { formatPrice } from "@/common/components/ui/Price";
import { PageLoader, ErrorState } from "@/common/components/ui/States";
import { Modal } from "@/common/components/ui/Modal";
import { Textarea } from "@/common/components/ui/FormControls";
import { useToast } from "@/common/components/ui/Toast";

type StatusLog = {
  id: string;
  toStatus: string;
  note?: string | null;
  createdAt: string;
};

type OrderItem = {
  id: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
};

type Payment = { method: string; status: string };

type Address = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
};

type Order = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  subtotal: string;
  taxAmount: string;
  shippingAmount: string;
  discountAmount: string;
  grandTotal: string;
  items: OrderItem[];
  statusLogs: StatusLog[];
  payments?: Payment[];
  shippingAddress: Address;
  billingAddress?: Address;
  customerNote?: string | null;
};

async function openInvoice(orderId: string) {
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

const TIMELINE_STEPS = [
  "CREATED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
];

function OrderDetailContent() {
  const params = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const qc = useQueryClient();
  const { toast } = useToast();
  const placed = search.get("placed") === "1";
  const { user, isLoading: authLoading } = useAuth();
  const orderId = params.id as string;
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  const {
    data: order,
    isLoading,
    isError,
    refetch,
  } = useQuery<Order>({
    queryKey: ["order", orderId],
    queryFn: () => api.get(`/orders/${orderId}`),
    enabled: !!user && !!orderId,
  });

  const cancel = useMutation({
    mutationFn: () =>
      api.post(`/orders/${orderId}/cancel`, { reason: cancelReason.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast({ variant: "success", title: "Order cancelled" });
      setCancelOpen(false);
      setCancelReason("");
    },
    onError: (err) => {
      toast({
        variant: "error",
        title: "Couldn't cancel",
        description: err instanceof ApiError ? err.message : "Try again shortly.",
      });
    },
  });

  if (authLoading || isLoading) return <PageLoader />;
  if (isError || !order)
    return (
      <ErrorState
        title="Order not found"
        description="We couldn't load this order."
        onRetry={() => refetch()}
      />
    );

  const currentIdx = TIMELINE_STEPS.indexOf(order.status);
  const logsByStatus: Record<string, StatusLog> = {};
  for (const log of order.statusLogs || []) {
    logsByStatus[log.toStatus] = log;
  }

  return (
    <div>
      {placed && (
        <div className="mb-6 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-5 sm:p-6 flex items-start gap-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
              Order placed successfully
            </h2>
            <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
              Thanks for shopping with us — a confirmation has been sent to
              your email.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-card-bg border border-card-border text-sm font-semibold text-foreground hover:bg-card-border/30"
              >
                <ShoppingBag className="h-4 w-4" /> Continue shopping
              </Link>
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90"
              >
                <Package className="h-4 w-4" /> View all orders
              </Link>
            </div>
          </div>
        </div>
      )}

      <Link
        href="/orders"
        className="inline-flex items-center text-sm font-medium text-muted hover:text-foreground mb-4"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-card-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Order {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Placed on{" "}
            <time dateTime={order.createdAt}>
              {new Date(order.createdAt).toLocaleString()}
            </time>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={order.status} kind="order" />
          <StatusBadge status={order.paymentStatus} kind="payment" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => openInvoice(order.id)}
          >
            View invoice
          </Button>
          {(order.status === "CREATED" || order.status === "CONFIRMED") && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<XCircle className="h-4 w-4" />}
              onClick={() => setCancelOpen(true)}
              className="border-danger/40 text-danger hover:bg-danger/10"
            >
              Cancel order
            </Button>
          )}
        </div>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this order?"
        description="Reserved stock will be released. Paid orders will be marked for refund processing."
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep order
            </Button>
            <Button
              variant="danger"
              loading={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              Cancel order
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason (optional)"
          placeholder="Help us improve — why are you cancelling?"
          rows={3}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          maxLength={500}
        />
      </Modal>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Order timeline
              </h2>
            </CardHeader>
            <CardBody>
              <ol className="relative">
                {TIMELINE_STEPS.map((s, idx) => {
                  const done = idx <= currentIdx && order.status !== "CANCELLED";
                  const active = idx === currentIdx && order.status !== "CANCELLED";
                  const log = logsByStatus[s];
                  const last = idx === TIMELINE_STEPS.length - 1;
                  return (
                    <li key={s} className="flex gap-3 pb-6 last:pb-0 relative">
                      {!last && (
                        <span
                          className={`absolute left-[11px] top-6 bottom-0 w-px ${
                            done ? "bg-accent" : "bg-card-border"
                          }`}
                          aria-hidden
                        />
                      )}
                      <span
                        className={`relative h-6 w-6 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${
                          done
                            ? "bg-accent text-white"
                            : active
                            ? "bg-accent/15 text-accent"
                            : "bg-card-border/50 text-muted"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : active ? (
                          <Clock className="h-3.5 w-3.5" />
                        ) : (
                          <Circle className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold ${
                            done || active ? "text-foreground" : "text-muted"
                          }`}
                        >
                          {s.charAt(0) + s.slice(1).toLowerCase()}
                        </p>
                        {log && (
                          <p className="text-xs text-muted mt-0.5">
                            {new Date(log.createdAt).toLocaleString()}
                            {log.note ? ` · ${log.note}` : ""}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
                {order.status === "CANCELLED" && (
                  <li className="flex gap-3">
                    <span className="h-6 w-6 rounded-full bg-danger/15 text-danger flex items-center justify-center mt-0.5">
                      <Circle className="h-3.5 w-3.5 fill-current" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-danger">
                        Cancelled
                      </p>
                    </div>
                  </li>
                )}
              </ol>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Items
              </h2>
            </CardHeader>
            <ul className="divide-y divide-card-border">
              {order.items.map((it) => (
                <li key={it.id} className="flex gap-4 p-5">
                  <div className="h-16 w-16 rounded-lg border border-card-border bg-background flex items-center justify-center shrink-0">
                    <Package className="h-7 w-7 text-muted/40" />
                  </div>
                  <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {it.productName}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {it.variantName} · Qty {it.quantity}
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Payment summary
              </h2>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-medium text-foreground">
                  {formatPrice(order.subtotal)}
                </dd>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Discount</dt>
                  <dd className="font-medium text-emerald-600 dark:text-emerald-400">
                    −{formatPrice(order.discountAmount)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Tax</dt>
                <dd className="font-medium text-foreground">
                  {formatPrice(order.taxAmount)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="font-medium text-foreground">
                  {Number(order.shippingAmount) === 0
                    ? "Free"
                    : formatPrice(order.shippingAmount)}
                </dd>
              </div>
              <div className="flex justify-between pt-3 border-t border-card-border text-base">
                <dt className="font-semibold text-foreground">Total</dt>
                <dd className="font-bold text-foreground">
                  {formatPrice(order.grandTotal)}
                </dd>
              </div>
              <div className="pt-3 text-xs text-muted">
                Payment via{" "}
                <span className="font-semibold text-foreground">
                  {order.payments?.[0]?.method || "—"}
                </span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Shipping address
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
                  Phone: {order.shippingAddress.phone}
                </p>
              </address>
            </CardBody>
          </Card>

          {order.customerNote && (
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-foreground">
                  Customer note
                </h2>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-foreground/90 whitespace-pre-line">
                  {order.customerNote}
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <OrderDetailContent />
    </Suspense>
  );
}
