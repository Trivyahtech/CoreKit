"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/platform/api/client";
import { Badge } from "@/common/components/ui/Badge";
import { Button } from "@/common/components/ui/Button";
import { Card, CardHeader } from "@/common/components/ui/Card";
import { Input } from "@/common/components/ui/Input";
import { Modal } from "@/common/components/ui/Modal";
import { Switch } from "@/common/components/ui/FormControls";
import { formatPrice } from "@/common/components/ui/Price";
import { useToast } from "@/common/components/ui/Toast";
import { useConfirm } from "@/common/components/ui/ConfirmDialog";

type Variant = {
  id: string;
  sku: string;
  title?: string | null;
  price: string;
  compareAtPrice?: string | null;
  stockOnHand: number;
  weightGrams?: number | null;
  status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
};

const EMPTY = {
  sku: "",
  title: "",
  price: "0",
  compareAtPrice: "",
  stockOnHand: "0",
  weightGrams: "",
  isActive: true,
};

export function VariantsCard({
  productId,
  variants,
  invalidateKey,
}: {
  productId: string;
  variants: Variant[];
  invalidateKey: readonly unknown[];
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Variant | null>(null);
  const [form, setForm] = useState(EMPTY);

  const refresh = () =>
    qc.invalidateQueries({ queryKey: invalidateKey as unknown[] });

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };
  const openEdit = (v: Variant) => {
    setEditing(v);
    setForm({
      sku: v.sku,
      title: v.title || "",
      price: String(v.price),
      compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : "",
      stockOnHand: String(v.stockOnHand),
      weightGrams: v.weightGrams ? String(v.weightGrams) : "",
      isActive: v.status === "ACTIVE",
    });
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: () => {
      const num = (v: string) => (v.trim() === "" ? undefined : Number(v));
      const payload = {
        sku: form.sku.trim(),
        title: form.title.trim() || undefined,
        price: Number(form.price) || 0,
        compareAtPrice: num(form.compareAtPrice),
        stockOnHand: Math.floor(Number(form.stockOnHand) || 0),
        weightGrams: num(form.weightGrams),
        isActive: form.isActive,
      };
      if (editing) {
        const { sku: _, ...rest } = payload;
        return api.patch(`/products/variants/${editing.id}`, rest);
      }
      return api.post(`/products/${productId}/variants`, payload);
    },
    onSuccess: () => {
      refresh();
      toast({
        variant: "success",
        title: editing ? "Variant updated" : "Variant added",
      });
      setOpen(false);
    },
    onError: (err) =>
      toast({
        variant: "error",
        title: "Couldn't save variant",
        description: err instanceof ApiError ? err.message : undefined,
      }),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/products/variants/${id}`),
    onSuccess: () => {
      refresh();
      toast({ variant: "success", title: "Variant removed" });
    },
    onError: (err) =>
      toast({
        variant: "error",
        title: "Couldn't delete",
        description: err instanceof ApiError ? err.message : undefined,
      }),
  });

  const onDelete = async (v: Variant) => {
    const ok = await confirm({
      title: `Delete variant "${v.title || v.sku}"?`,
      description: "Variants with order history cannot be deleted — archive instead.",
      tone: "danger",
      confirmLabel: "Delete",
    });
    if (ok) del.mutate(v.id);
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Variants</h2>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={openNew}
        >
          Add variant
        </Button>
      </CardHeader>
      <div className="px-5 pb-5">
        {variants.length === 0 ? (
          <p className="text-sm text-muted py-4 text-center">
            No variants yet. Add one to make this product purchasable.
          </p>
        ) : (
          <ul className="divide-y divide-card-border">
            {variants.map((v) => (
              <li key={v.id} className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground">
                      {v.title || "(unnamed)"}
                    </p>
                    {v.status !== "ACTIVE" && (
                      <Badge tone="neutral" size="sm">
                        {v.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted font-mono">SKU: {v.sku}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">
                    {formatPrice(v.price)}
                    {v.compareAtPrice && (
                      <span className="ml-1 text-xs text-muted line-through">
                        {formatPrice(v.compareAtPrice)}
                      </span>
                    )}
                  </p>
                  <p
                    className={`text-xs ${
                      v.stockOnHand === 0
                        ? "text-danger"
                        : v.stockOnHand < 10
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted"
                    }`}
                  >
                    {v.stockOnHand} in stock
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(v)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-card-border/40 text-muted hover:text-foreground"
                    aria-label="Edit variant"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(v)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-danger/10 text-muted hover:text-danger"
                    aria-label="Delete variant"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit variant" : "New variant"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={save.isPending} onClick={() => save.mutate()}>
              Save
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="SKU"
              required
              value={form.sku}
              disabled={!!editing}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              hint={editing ? "SKU is immutable once created" : "Unique product stock code"}
            />
            <Input
              label="Title"
              value={form.title}
              placeholder="e.g. Medium / Red"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Price (₹)"
              type="number"
              min={0}
              step="0.01"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <Input
              label="Compare-at price (₹)"
              type="number"
              min={0}
              step="0.01"
              value={form.compareAtPrice}
              onChange={(e) =>
                setForm({ ...form, compareAtPrice: e.target.value })
              }
              hint="Shown as struck-through"
            />
            <Input
              label="Weight (g)"
              type="number"
              min={0}
              value={form.weightGrams}
              onChange={(e) =>
                setForm({ ...form, weightGrams: e.target.value })
              }
            />
          </div>
          <Input
            label="Stock on hand"
            type="number"
            min={0}
            value={form.stockOnHand}
            onChange={(e) => setForm({ ...form, stockOnHand: e.target.value })}
          />
          <Switch
            checked={form.isActive}
            onChange={(v) => setForm({ ...form, isActive: v })}
            label="Active"
            description="Inactive variants don't appear on the storefront"
          />
        </form>
      </Modal>
    </Card>
  );
}
