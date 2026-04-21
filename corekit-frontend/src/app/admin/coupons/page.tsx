"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { api, ApiError } from "@/platform/api/client";
import { AdminPageHeader } from "@/common/components/layout/AdminPageHeader";
import { Badge } from "@/common/components/ui/Badge";
import { Button } from "@/common/components/ui/Button";
import { Card } from "@/common/components/ui/Card";
import { DataTable, type Column } from "@/common/components/ui/DataTable";
import { Input } from "@/common/components/ui/Input";
import { Select, Switch } from "@/common/components/ui/FormControls";
import { Modal } from "@/common/components/ui/Modal";
import { formatPrice } from "@/common/components/ui/Price";
import {
  EmptyState,
  ErrorState,
  PageLoader,
} from "@/common/components/ui/States";
import { useToast } from "@/common/components/ui/Toast";
import { useConfirm } from "@/common/components/ui/ConfirmDialog";

type Coupon = {
  id: string;
  code: string;
  type: "FLAT" | "PERCENTAGE";
  value: string;
  minCartValue?: string | null;
  maxDiscountAmount?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
};

const EMPTY = {
  code: "",
  type: "PERCENTAGE" as "FLAT" | "PERCENTAGE",
  value: "10",
  minCartValue: "",
  maxDiscountAmount: "",
  usageLimit: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

function randomCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(EMPTY);

  const { data, isLoading, isError, refetch } = useQuery<Coupon[]>({
    queryKey: ["admin-coupons"],
    queryFn: () => api.get("/coupons"),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, code: randomCode() });
    setOpen(true);
  };
  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      minCartValue: c.minCartValue ? String(c.minCartValue) : "",
      maxDiscountAmount: c.maxDiscountAmount ? String(c.maxDiscountAmount) : "",
      usageLimit: c.usageLimit ? String(c.usageLimit) : "",
      startsAt: c.startsAt ? c.startsAt.slice(0, 16) : "",
      endsAt: c.endsAt ? c.endsAt.slice(0, 16) : "",
      isActive: c.isActive,
    });
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: () => {
      const num = (v: string) => (v.trim() === "" ? undefined : Number(v));
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value) || 0,
        minCartValue: num(form.minCartValue),
        maxDiscountAmount: num(form.maxDiscountAmount),
        usageLimit: form.usageLimit ? Math.floor(Number(form.usageLimit)) : undefined,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
        isActive: form.isActive,
      };
      if (editing) return api.patch(`/coupons/${editing.id}`, payload);
      return api.post("/coupons", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({
        variant: "success",
        title: editing ? "Coupon updated" : "Coupon created",
      });
      setOpen(false);
    },
    onError: (err) =>
      toast({
        variant: "error",
        title: "Couldn't save coupon",
        description: err instanceof ApiError ? err.message : undefined,
      }),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/coupons/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ variant: "success", title: "Coupon deleted" });
    },
  });

  const onDelete = async (c: Coupon) => {
    const ok = await confirm({
      title: `Delete "${c.code}"?`,
      description: "This cannot be undone.",
      tone: "danger",
      confirmLabel: "Delete",
    });
    if (ok) del.mutate(c.id);
  };

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    toast({ variant: "success", title: `Copied ${code}` });
  };

  const cols: Column<Coupon>[] = [
    {
      key: "code",
      header: "Code",
      cell: (c) => (
        <div className="flex items-center gap-2">
          <code className="font-mono text-sm bg-card-border/50 px-2 py-0.5 rounded text-foreground">
            {c.code}
          </code>
          <button
            onClick={() => copyCode(c.code)}
            className="text-muted hover:text-foreground"
            aria-label="Copy code"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
    {
      key: "discount",
      header: "Discount",
      cell: (c) =>
        c.type === "PERCENTAGE"
          ? `${c.value}% off`
          : `Flat ${formatPrice(c.value)}`,
    },
    {
      key: "min",
      header: "Min order",
      cell: (c) => (c.minCartValue ? formatPrice(c.minCartValue) : "—"),
    },
    {
      key: "usage",
      header: "Usage",
      cell: (c) => (
        <span>
          {c.usedCount}
          {c.usageLimit ? ` / ${c.usageLimit}` : ""}
        </span>
      ),
    },
    {
      key: "window",
      header: "Valid",
      cell: (c) => (
        <span className="text-xs text-muted">
          {c.startsAt ? new Date(c.startsAt).toLocaleDateString() : "any"}
          {" – "}
          {c.endsAt ? new Date(c.endsAt).toLocaleDateString() : "any"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (c) =>
        c.isActive ? (
          <Badge tone="success">Active</Badge>
        ) : (
          <Badge tone="neutral">Inactive</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => openEdit(c)}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-card-border/40 text-muted hover:text-foreground"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(c)}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-danger/10 text-muted hover:text-danger"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Coupons"
        description="Create and manage discount codes"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Coupons" },
        ]}
        actions={
          <Button onClick={openNew} leftIcon={<Plus className="h-4 w-4" />}>
            New coupon
          </Button>
        }
      />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No coupons"
          description="Create your first discount code to run a promo."
          action={
            <Button onClick={openNew} leftIcon={<Plus className="h-4 w-4" />}>
              New coupon
            </Button>
          }
        />
      ) : (
        <Card>
          <DataTable columns={cols} rows={data} keyBy={(r) => r.id} />
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit coupon" : "New coupon"}
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
              label="Code"
              required
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
              hint="Customer-facing code (uppercase)"
            />
            <Select
              label="Type"
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value as "FLAT" | "PERCENTAGE",
                })
              }
            >
              <option value="PERCENTAGE">Percentage</option>
              <option value="FLAT">Flat amount</option>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label={form.type === "PERCENTAGE" ? "Percent off" : "Amount off (₹)"}
              type="number"
              min={0}
              step={form.type === "PERCENTAGE" ? 1 : 0.01}
              required
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
            <Input
              label="Min cart value (₹)"
              type="number"
              min={0}
              step="0.01"
              value={form.minCartValue}
              onChange={(e) =>
                setForm({ ...form, minCartValue: e.target.value })
              }
            />
            <Input
              label="Max discount (₹)"
              type="number"
              min={0}
              step="0.01"
              value={form.maxDiscountAmount}
              onChange={(e) =>
                setForm({ ...form, maxDiscountAmount: e.target.value })
              }
              hint="Cap for % coupons"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Usage limit"
              type="number"
              min={1}
              step={1}
              value={form.usageLimit}
              onChange={(e) =>
                setForm({ ...form, usageLimit: e.target.value })
              }
              hint="Total redemptions"
            />
            <Input
              label="Starts at"
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            />
            <Input
              label="Ends at"
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            />
          </div>
          <Switch
            checked={form.isActive}
            onChange={(v) => setForm({ ...form, isActive: v })}
            label="Active"
            description="Inactive coupons cannot be redeemed"
          />
        </form>
      </Modal>
    </div>
  );
}
