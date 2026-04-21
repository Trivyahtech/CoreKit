"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  Layers,
  Package,
  PackageCheck,
  Plus,
  Warehouse,
} from "lucide-react";
import { api, ApiError } from "@/platform/api/client";
import { AdminPageHeader } from "@/common/components/layout/AdminPageHeader";
import { Badge } from "@/common/components/ui/Badge";
import { Button } from "@/common/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/common/components/ui/Card";
import { DataTable, type Column } from "@/common/components/ui/DataTable";
import { Input } from "@/common/components/ui/Input";
import { Modal } from "@/common/components/ui/Modal";
import { Select, Textarea } from "@/common/components/ui/FormControls";
import { Skeleton } from "@/common/components/ui/Skeleton";
import { Tabs, type TabItem } from "@/common/components/ui/Tabs";
import { PageLoader } from "@/common/components/ui/States";
import { useToast } from "@/common/components/ui/Toast";

type Summary = {
  totalSkus: number;
  totalUnits: number;
  reserved: number;
  outOfStock: number;
  lowStock: number;
  lowStockVariants: Array<{
    id: string;
    sku: string;
    title?: string | null;
    stockOnHand: number;
    reservedStock: number;
    product: { id: string; name: string };
  }>;
};

type Lot = {
  id: string;
  lotNumber: string;
  quantity: number;
  remaining: number;
  unitCost: string;
  receivedAt: string;
  expiryAt?: string | null;
  variant: {
    id: string;
    sku: string;
    title?: string | null;
    product: { id: string; name: string };
  };
};

type LedgerEntry = {
  id: string;
  change: number;
  reason: string;
  refType?: string | null;
  refId?: string | null;
  note?: string | null;
  createdAt: string;
  actorUserId?: string | null;
  variant: {
    id: string;
    sku: string;
    title?: string | null;
    product: { id: string; name: string };
  };
};

const REASONS = [
  "ADJUSTMENT_MANUAL",
  "ADJUSTMENT_COUNT",
  "DAMAGE",
  "LOSS",
  "RETURN",
];

type TabKey = "overview" | "lots" | "ledger";

const TABS: TabItem<TabKey>[] = [
  { key: "overview", label: "Overview", icon: Warehouse },
  { key: "lots", label: "Lots", icon: Layers },
  { key: "ledger", label: "Audit ledger", icon: ClipboardList },
];

export default function AdminInventoryPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabKey>("overview");
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    variantId: "",
    change: "0",
    reason: "ADJUSTMENT_MANUAL",
    note: "",
  });

  const { data: summary, isLoading: loadingSummary } = useQuery<Summary>({
    queryKey: ["inv-summary"],
    queryFn: () => api.get("/inventory/summary"),
  });

  const { data: lots } = useQuery<Lot[]>({
    queryKey: ["inv-lots"],
    queryFn: () => api.get("/inventory/lots?onlyRemaining=true"),
    enabled: tab === "lots",
  });

  const { data: ledger } = useQuery<LedgerEntry[]>({
    queryKey: ["inv-ledger"],
    queryFn: () => api.get("/inventory/ledger?limit=100"),
    enabled: tab === "ledger",
  });

  const adjust = useMutation({
    mutationFn: () =>
      api.post("/inventory/adjust", {
        ...adjustForm,
        change: Number(adjustForm.change),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inv-summary"] });
      qc.invalidateQueries({ queryKey: ["inv-lots"] });
      qc.invalidateQueries({ queryKey: ["inv-ledger"] });
      toast({ variant: "success", title: "Stock adjusted" });
      setAdjustOpen(false);
      setAdjustForm({ variantId: "", change: "0", reason: "ADJUSTMENT_MANUAL", note: "" });
    },
    onError: (err) =>
      toast({
        variant: "error",
        title: "Couldn't adjust",
        description: err instanceof ApiError ? err.message : undefined,
      }),
  });

  const lotCols: Column<Lot>[] = [
    {
      key: "lot",
      header: "Lot",
      cell: (l) => (
        <div>
          <p className="font-mono text-sm text-foreground">{l.lotNumber}</p>
          <p className="text-xs text-muted">
            Received {new Date(l.receivedAt).toLocaleDateString()}
          </p>
        </div>
      ),
    },
    {
      key: "variant",
      header: "Variant",
      cell: (l) => (
        <div>
          <Link
            href={`/admin/products/${l.variant.product.id}`}
            className="font-medium text-foreground hover:text-accent"
          >
            {l.variant.product.name}
          </Link>
          <p className="text-xs text-muted font-mono">{l.variant.sku}</p>
        </div>
      ),
    },
    {
      key: "qty",
      header: "Qty",
      align: "right",
      cell: (l) => (
        <span className="text-foreground">
          {l.remaining}
          <span className="text-muted text-xs"> / {l.quantity}</span>
        </span>
      ),
    },
    {
      key: "cost",
      header: "Unit cost",
      align: "right",
      cell: (l) => <span className="text-muted">₹{Number(l.unitCost).toFixed(2)}</span>,
    },
    {
      key: "expiry",
      header: "Expiry",
      cell: (l) =>
        l.expiryAt ? (
          <time className="text-xs text-muted">
            {new Date(l.expiryAt).toLocaleDateString()}
          </time>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
  ];

  const ledgerCols: Column<LedgerEntry>[] = [
    {
      key: "date",
      header: "When",
      cell: (l) => (
        <time dateTime={l.createdAt} className="text-xs text-muted">
          {new Date(l.createdAt).toLocaleString()}
        </time>
      ),
    },
    {
      key: "variant",
      header: "Variant",
      cell: (l) => (
        <div>
          <Link
            href={`/admin/products/${l.variant.product.id}`}
            className="font-medium text-foreground hover:text-accent"
          >
            {l.variant.product.name}
          </Link>
          <p className="text-xs text-muted font-mono">{l.variant.sku}</p>
        </div>
      ),
    },
    {
      key: "change",
      header: "Change",
      align: "right",
      cell: (l) => (
        <span
          className={
            l.change > 0
              ? "font-bold text-emerald-600 dark:text-emerald-400"
              : l.change < 0
              ? "font-bold text-danger"
              : "font-medium text-muted"
          }
        >
          {l.change > 0 ? `+${l.change}` : l.change === 0 ? "●" : l.change}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      cell: (l) => (
        <Badge
          tone={
            l.reason.startsWith("ORDER_CANCELLED") || l.reason === "ORDER_REFUNDED"
              ? "warning"
              : l.reason === "PURCHASE_ORDER_RECEIVED"
              ? "success"
              : l.reason.startsWith("ADJUSTMENT")
              ? "info"
              : "neutral"
          }
          size="sm"
        >
          {l.reason.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "ref",
      header: "Reference",
      cell: (l) =>
        l.refType && l.refId ? (
          l.refType === "Order" ? (
            <Link
              href={`/admin/orders/${l.refId}`}
              className="text-accent hover:underline text-xs font-mono"
            >
              Order → {l.refId.slice(-8)}
            </Link>
          ) : l.refType === "PurchaseOrder" ? (
            <Link
              href={`/admin/purchase-orders/${l.refId}`}
              className="text-accent hover:underline text-xs font-mono"
            >
              PO → {l.refId.slice(-8)}
            </Link>
          ) : (
            <span className="text-xs text-muted">{l.refType}</span>
          )
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
    {
      key: "note",
      header: "Note",
      cell: (l) => (
        <span className="text-xs text-muted line-clamp-1" title={l.note ?? ""}>
          {l.note || "—"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Inventory"
        description="Track stock, lots, and every movement"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Inventory" },
        ]}
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setAdjustOpen(true)}
          >
            Manual adjustment
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="SKUs"
          value={summary?.totalSkus}
          icon={Boxes}
          tone="indigo"
          loading={loadingSummary}
        />
        <StatCard
          label="Units on hand"
          value={summary?.totalUnits}
          icon={PackageCheck}
          tone="emerald"
          loading={loadingSummary}
        />
        <StatCard
          label="Reserved"
          value={summary?.reserved}
          icon={Layers}
          tone="amber"
          loading={loadingSummary}
        />
        <StatCard
          label="Out of stock"
          value={summary?.outOfStock}
          icon={AlertTriangle}
          tone="danger"
          loading={loadingSummary}
        />
      </div>

      <Tabs items={TABS} value={tab} onChange={setTab} className="mb-5" />

      {tab === "overview" && (
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-foreground">
              Low stock
            </h2>
          </CardHeader>
          {summary && summary.lowStockVariants.length > 0 ? (
            <ul className="divide-y divide-card-border">
              {summary.lowStockVariants.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-card-border/15"
                >
                  <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/admin/products/${v.product.id}`}
                      className="font-medium text-foreground hover:text-accent truncate block"
                    >
                      {v.product.name}
                    </Link>
                    <p className="text-xs text-muted font-mono">
                      {v.sku}
                      {v.title ? ` · ${v.title}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={
                        v.stockOnHand === 0
                          ? "text-danger font-bold"
                          : "text-amber-600 dark:text-amber-400 font-bold"
                      }
                    >
                      {v.stockOnHand}
                    </p>
                    <p className="text-xs text-muted">{v.reservedStock} reserved</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAdjustForm({
                        variantId: v.id,
                        change: "10",
                        reason: "ADJUSTMENT_MANUAL",
                        note: "",
                      });
                      setAdjustOpen(true);
                    }}
                  >
                    Adjust
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <CardBody>
              <p className="text-sm text-muted text-center py-4">
                All stock levels look healthy.
              </p>
            </CardBody>
          )}
        </Card>
      )}

      {tab === "lots" && (
        <DataTable
          columns={lotCols}
          rows={lots || []}
          keyBy={(r) => r.id}
          empty={
            <Card>
              <CardBody>
                <p className="text-sm text-muted text-center py-8">
                  No active lots yet. Receive a purchase order to create lots.
                </p>
              </CardBody>
            </Card>
          }
        />
      )}

      {tab === "ledger" && (
        <DataTable
          columns={ledgerCols}
          rows={ledger || []}
          keyBy={(r) => r.id}
          compact
          empty={
            <Card>
              <CardBody>
                <p className="text-sm text-muted text-center py-8">
                  No stock movements recorded yet.
                </p>
              </CardBody>
            </Card>
          }
        />
      )}

      <Modal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title="Manual stock adjustment"
        description="This writes a ledger entry and updates stockOnHand. Every change is audited."
        footer={
          <>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={adjust.isPending}
              disabled={!adjustForm.variantId || adjustForm.change === "0"}
              onClick={() => adjust.mutate()}
            >
              Apply
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            adjust.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Variant ID"
            required
            value={adjustForm.variantId}
            onChange={(e) =>
              setAdjustForm({ ...adjustForm, variantId: e.target.value })
            }
            hint="Copy from a product's variant"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Change (+/−)"
              type="number"
              value={adjustForm.change}
              onChange={(e) =>
                setAdjustForm({ ...adjustForm, change: e.target.value })
              }
              hint="Positive adds, negative removes"
            />
            <Select
              label="Reason"
              value={adjustForm.reason}
              onChange={(e) =>
                setAdjustForm({ ...adjustForm, reason: e.target.value })
              }
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </div>
          <Textarea
            label="Note"
            rows={3}
            value={adjustForm.note}
            onChange={(e) =>
              setAdjustForm({ ...adjustForm, note: e.target.value })
            }
            placeholder="e.g. Recount after cycle check"
          />
        </form>
      </Modal>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value?: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "indigo" | "emerald" | "amber" | "danger";
  loading?: boolean;
}) {
  const toneCls = {
    indigo: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-400",
    emerald: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400",
    amber: "text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400",
    danger: "text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400",
  }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`h-9 w-9 rounded-lg ${toneCls} flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-12" />
      ) : (
        <p className="text-2xl font-bold text-foreground">{value ?? 0}</p>
      )}
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </Card>
  );
}
