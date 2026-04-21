"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { api, ApiError, TENANT_SLUG } from "@/platform/api/client";
import { AdminPageHeader } from "@/common/components/layout/AdminPageHeader";
import { Button } from "@/common/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/common/components/ui/Card";
import { Input } from "@/common/components/ui/Input";
import { Select, Textarea } from "@/common/components/ui/FormControls";
import { formatPrice } from "@/common/components/ui/Price";
import { useToast } from "@/common/components/ui/Toast";

type Supplier = { id: string; name: string };

type AdminVariant = {
  id: string;
  sku: string;
  title?: string | null;
};

type AdminProduct = {
  id: string;
  name: string;
  variants: AdminVariant[];
};

type LineItem = {
  variantId: string;
  quantity: string;
  unitCost: string;
};

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const { toast } = useToast();

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["admin-suppliers"],
    queryFn: () => api.get("/purchase-orders/suppliers"),
  });

  const { data: products } = useQuery<AdminProduct[]>({
    queryKey: ["admin-products"],
    queryFn: () => api.get(`/products?tenant=${TENANT_SLUG}`),
  });

  const [supplierId, setSupplierId] = useState("");
  const [expectedAt, setExpectedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { variantId: "", quantity: "1", unitCost: "0" },
  ]);

  const variantOptions = useMemo(() => {
    const opts: Array<{ id: string; label: string }> = [];
    for (const p of products || []) {
      for (const v of p.variants || []) {
        opts.push({
          id: v.id,
          label: `${p.name}${v.title ? ` · ${v.title}` : ""} (${v.sku})`,
        });
      }
    }
    return opts;
  }, [products]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0),
        0,
      ),
    [items],
  );

  const create = useMutation({
    mutationFn: () =>
      api.post("/purchase-orders", {
        supplierId,
        expectedAt: expectedAt ? new Date(expectedAt).toISOString() : undefined,
        notes: notes || undefined,
        items: items
          .filter((it) => it.variantId && Number(it.quantity) > 0)
          .map((it) => ({
            variantId: it.variantId,
            quantity: Math.floor(Number(it.quantity)),
            unitCost: Number(it.unitCost) || 0,
          })),
      }),
    onSuccess: (po: { id: string }) => {
      toast({ variant: "success", title: "Purchase order created" });
      router.push(`/admin/purchase-orders/${po.id}`);
    },
    onError: (err) =>
      toast({
        variant: "error",
        title: "Couldn't create PO",
        description: err instanceof ApiError ? err.message : undefined,
      }),
  });

  const canSubmit =
    supplierId &&
    items.some((i) => i.variantId && Number(i.quantity) > 0 && Number(i.unitCost) >= 0);

  return (
    <div>
      <AdminPageHeader
        title="New purchase order"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Purchase orders", href: "/admin/purchase-orders" },
          { label: "New" },
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="grid lg:grid-cols-3 gap-6 items-start"
      >
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Details
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Select
                label="Supplier"
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">— Choose a supplier —</option>
                {(suppliers || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              {(!suppliers || suppliers.length === 0) && (
                <p className="text-xs text-muted">
                  No suppliers yet. Add one from the purchase orders list page.
                </p>
              )}
              <Input
                label="Expected delivery"
                type="datetime-local"
                value={expectedAt}
                onChange={(e) => setExpectedAt(e.target.value)}
              />
              <Textarea
                label="Notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reference numbers, special instructions…"
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Items</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() =>
                  setItems([
                    ...items,
                    { variantId: "", quantity: "1", unitCost: "0" },
                  ])
                }
              >
                Add row
              </Button>
            </CardHeader>
            <CardBody className="space-y-3">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-end pb-3 border-b last:border-0 border-card-border"
                >
                  <div className="col-span-12 sm:col-span-6">
                    <Select
                      label="Variant"
                      value={it.variantId}
                      onChange={(e) => {
                        const next = [...items];
                        next[idx] = { ...next[idx], variantId: e.target.value };
                        setItems(next);
                      }}
                    >
                      <option value="">— Pick a variant —</option>
                      {variantOptions.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Input
                      label="Qty"
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => {
                        const next = [...items];
                        next[idx] = { ...next[idx], quantity: e.target.value };
                        setItems(next);
                      }}
                    />
                  </div>
                  <div className="col-span-5 sm:col-span-3">
                    <Input
                      label="Unit cost (₹)"
                      type="number"
                      min={0}
                      step="0.01"
                      value={it.unitCost}
                      onChange={(e) => {
                        const next = [...items];
                        next[idx] = { ...next[idx], unitCost: e.target.value };
                        setItems(next);
                      }}
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setItems(items.filter((_, i) => i !== idx))
                      }
                      className="h-10 w-10 inline-flex items-center justify-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                      aria-label="Remove row"
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Summary
              </h2>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Line items</dt>
                <dd className="text-foreground">
                  {items.filter((i) => i.variantId).length}
                </dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-card-border text-base">
                <dt className="font-semibold text-foreground">Subtotal</dt>
                <dd className="font-bold text-foreground">
                  {formatPrice(subtotal)}
                </dd>
              </div>
              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={create.isPending}
                disabled={!canSubmit}
              >
                Create PO (draft)
              </Button>
            </CardBody>
          </Card>
        </aside>
      </form>
    </div>
  );
}
