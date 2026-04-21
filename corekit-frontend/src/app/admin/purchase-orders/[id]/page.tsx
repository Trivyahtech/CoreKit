"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, PackageCheck, XCircle } from "lucide-react";
import { api, ApiError } from "@/platform/api/client";
import { AdminPageHeader } from "@/common/components/layout/AdminPageHeader";
import { Badge } from "@/common/components/ui/Badge";
import { Button } from "@/common/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/common/components/ui/Card";
import { Input } from "@/common/components/ui/Input";
import { Textarea } from "@/common/components/ui/FormControls";
import { formatPrice } from "@/common/components/ui/Price";
import {
  ErrorState,
  PageLoader,
} from "@/common/components/ui/States";
import { useConfirm } from "@/common/components/ui/ConfirmDialog";
import { useToast } from "@/common/components/ui/Toast";

type POItem = {
  id: string;
  quantity: number;
  received: number;
  unitCost: string;
  totalCost: string;
  variant: {
    id: string;
    sku: string;
    title?: string | null;
    product: { id: string; name: string };
  };
};

type PO = {
  id: string;
  poNumber: string;
  status: string;
  subtotal: string;
  notes?: string | null;
  expectedAt?: string | null;
  receivedAt?: string | null;
  createdAt: string;
  supplier: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  items: POItem[];
};

const STATUS_TONE: Record<string, "neutral" | "warning" | "info" | "success" | "danger"> = {
  DRAFT: "neutral",
  ORDERED: "info",
  PARTIAL: "warning",
  RECEIVED: "success",
  CANCELLED: "danger",
};

export default function AdminPurchaseOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { toast } = useToast();

  const { data: po, isLoading, isError, refetch } = useQuery<PO>({
    queryKey: ["admin-po", id],
    queryFn: () => api.get(`/purchase-orders/${id}`),
    enabled: !!id,
  });

  const [receipts, setReceipts] = useState<Record<string, string>>({});
  const [lotNumbers, setLotNumbers] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  const canReceive =
    po &&
    po.status !== "RECEIVED" &&
    po.status !== "CANCELLED" &&
    Object.values(receipts).some((v) => Number(v) > 0);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-po", id] });
    qc.invalidateQueries({ queryKey: ["admin-pos"] });
    qc.invalidateQueries({ queryKey: ["inv-summary"] });
    qc.invalidateQueries({ queryKey: ["inv-lots"] });
    qc.invalidateQueries({ queryKey: ["inv-ledger"] });
  };

  const setStatus = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/purchase-orders/${id}/status`, { status }),
    onSuccess: () => {
      invalidate();
      toast({ variant: "success", title: "Status updated" });
    },
    onError: (err) =>
      toast({
        variant: "error",
        title: "Couldn't update",
        description: err instanceof ApiError ? err.message : undefined,
      }),
  });

  const receive = useMutation({
    mutationFn: () =>
      api.post(`/purchase-orders/${id}/receive`, {
        note: note || undefined,
        items: Object.entries(receipts)
          .map(([itemId, qty]) => ({
            itemId,
            quantityReceived: Math.max(0, Math.floor(Number(qty) || 0)),
            lotNumber: lotNumbers[itemId] || undefined,
          }))
          .filter((it) => it.quantityReceived > 0),
      }),
    onSuccess: () => {
      invalidate();
      toast({
        variant: "success",
        title: "Received",
        description: "Stock and lots updated. Ledger audit written.",
      });
      setReceipts({});
      setLotNumbers({});
      setNote("");
    },
    onError: (err) =>
      toast({
        variant: "error",
        title: "Couldn't receive",
        description: err instanceof ApiError ? err.message : undefined,
      }),
  });

  const cancel = useMutation({
    mutationFn: () => api.post(`/purchase-orders/${id}/cancel`, {}),
    onSuccess: () => {
      invalidate();
      toast({ variant: "success", title: "Purchase order cancelled" });
    },
  });

  const onCancel = async () => {
    const ok = await confirm({
      title: "Cancel this purchase order?",
      description: "Draft or partial POs can be cancelled. Received stock is not reversed.",
      tone: "danger",
      confirmLabel: "Cancel PO",
    });
    if (ok) cancel.mutate();
  };

  const totalExpected = useMemo(
    () => po?.items.reduce((s, it) => s + it.quantity, 0) ?? 0,
    [po],
  );
  const totalReceived = useMemo(
    () => po?.items.reduce((s, it) => s + it.received, 0) ?? 0,
    [po],
  );

  if (isLoading) return <PageLoader />;
  if (isError || !po)
    return <ErrorState title="Purchase order not found" onRetry={() => refetch()} />;

  return (
    <div>
      <AdminPageHeader
        title={po.poNumber}
        description={`Supplier: ${po.supplier.name}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Purchase orders", href: "/admin/purchase-orders" },
          { label: po.poNumber },
        ]}
        actions={
          <Link
            href="/admin/purchase-orders"
            className="inline-flex h-10 px-3 items-center gap-1.5 rounded-lg border border-card-border bg-card-bg text-sm font-semibold hover:bg-card-border/30"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Items</h2>
              <div className="flex items-center gap-2">
                <Badge tone={STATUS_TONE[po.status]}>{po.status}</Badge>
                <span className="text-xs text-muted">
                  {totalReceived} / {totalExpected} received
                </span>
              </div>
            </CardHeader>
            <ul className="divide-y divide-card-border">
              {po.items.map((it) => {
                const outstanding = it.quantity - it.received;
                const inputVal = receipts[it.id] ?? "";
                return (
                  <li key={it.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/admin/products/${it.variant.product.id}`}
                        className="font-semibold text-foreground hover:text-accent"
                      >
                        {it.variant.product.name}
                      </Link>
                      <p className="text-xs text-muted font-mono mt-0.5">
                        {it.variant.sku}
                        {it.variant.title ? ` · ${it.variant.title}` : ""}
                      </p>
                      <p className="text-xs text-muted mt-1">
                        {it.received} / {it.quantity} received · cost {formatPrice(it.unitCost)}
                      </p>
                    </div>
                    {outstanding > 0 && po.status !== "CANCELLED" && po.status !== "RECEIVED" ? (
                      <div className="flex items-end gap-2">
                        <Input
                          label={`Receive (max ${outstanding})`}
                          type="number"
                          min={0}
                          max={outstanding}
                          value={inputVal}
                          onChange={(e) =>
                            setReceipts({ ...receipts, [it.id]: e.target.value })
                          }
                          className="w-28"
                        />
                        <Input
                          label="Lot # (optional)"
                          value={lotNumbers[it.id] ?? ""}
                          onChange={(e) =>
                            setLotNumbers({ ...lotNumbers, [it.id]: e.target.value })
                          }
                          className="w-40"
                        />
                      </div>
                    ) : (
                      <Badge
                        tone={it.received >= it.quantity ? "success" : "neutral"}
                      >
                        {it.received >= it.quantity ? "Complete" : `${outstanding} outstanding`}
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ul>
            {po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
              <CardBody>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Textarea
                    label="Receive note (optional)"
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Condition, inspection notes, lot source…"
                    className="flex-1"
                  />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    leftIcon={<PackageCheck className="h-4 w-4" />}
                    loading={receive.isPending}
                    disabled={!canReceive}
                    onClick={() => receive.mutate()}
                  >
                    Receive items
                  </Button>
                </div>
              </CardBody>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Actions
              </h2>
            </CardHeader>
            <CardBody className="space-y-2">
              {po.status === "DRAFT" && (
                <Button
                  fullWidth
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  loading={setStatus.isPending}
                  onClick={() => setStatus.mutate("ORDERED")}
                >
                  Mark as ordered
                </Button>
              )}
              {po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
                <Button
                  fullWidth
                  variant="outline"
                  leftIcon={<XCircle className="h-4 w-4" />}
                  onClick={onCancel}
                  className="border-danger/40 text-danger hover:bg-danger/10"
                >
                  Cancel purchase order
                </Button>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Summary
              </h2>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Supplier</dt>
                <dd className="text-foreground">{po.supplier.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Created</dt>
                <dd className="text-foreground">
                  {new Date(po.createdAt).toLocaleDateString()}
                </dd>
              </div>
              {po.expectedAt && (
                <div className="flex justify-between">
                  <dt className="text-muted">Expected</dt>
                  <dd className="text-foreground">
                    {new Date(po.expectedAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {po.receivedAt && (
                <div className="flex justify-between">
                  <dt className="text-muted">Received</dt>
                  <dd className="text-foreground">
                    {new Date(po.receivedAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-card-border text-base">
                <dt className="font-semibold text-foreground">Subtotal</dt>
                <dd className="font-bold text-foreground">
                  {formatPrice(po.subtotal)}
                </dd>
              </div>
            </CardBody>
          </Card>

          {po.notes && (
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-foreground">
                  Notes
                </h2>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-foreground/90 whitespace-pre-line">
                  {po.notes}
                </p>
              </CardBody>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
