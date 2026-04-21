"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Truck, Users } from "lucide-react";
import { api, ApiError } from "@/platform/api/client";
import { AdminPageHeader } from "@/common/components/layout/AdminPageHeader";
import { Badge } from "@/common/components/ui/Badge";
import { Button } from "@/common/components/ui/Button";
import { Card } from "@/common/components/ui/Card";
import { DataTable, type Column } from "@/common/components/ui/DataTable";
import { Input } from "@/common/components/ui/Input";
import { Modal } from "@/common/components/ui/Modal";
import { formatPrice } from "@/common/components/ui/Price";
import {
  EmptyState,
  ErrorState,
  PageLoader,
} from "@/common/components/ui/States";
import { useToast } from "@/common/components/ui/Toast";

type PO = {
  id: string;
  poNumber: string;
  status: string;
  subtotal: string;
  expectedAt?: string | null;
  receivedAt?: string | null;
  createdAt: string;
  supplier: { id: string; name: string };
  items: Array<{ quantity: number; received: number }>;
};

type Supplier = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
};

const STATUS_TONE: Record<string, "neutral" | "warning" | "info" | "success" | "danger"> = {
  DRAFT: "neutral",
  ORDERED: "info",
  PARTIAL: "warning",
  RECEIVED: "success",
  CANCELLED: "danger",
};

export default function AdminPurchaseOrdersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const { data: pos, isLoading, isError, refetch } = useQuery<PO[]>({
    queryKey: ["admin-pos"],
    queryFn: () => api.get("/purchase-orders"),
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["admin-suppliers"],
    queryFn: () => api.get("/purchase-orders/suppliers"),
  });

  const addSupplier = useMutation({
    mutationFn: () => api.post("/purchase-orders/suppliers", supplierForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-suppliers"] });
      toast({ variant: "success", title: "Supplier added" });
      setSupplierOpen(false);
      setSupplierForm({ name: "", email: "", phone: "", address: "" });
    },
    onError: (err) =>
      toast({
        variant: "error",
        title: "Couldn't add supplier",
        description: err instanceof ApiError ? err.message : undefined,
      }),
  });

  const cols: Column<PO>[] = [
    {
      key: "po",
      header: "PO",
      cell: (p) => (
        <Link
          href={`/admin/purchase-orders/${p.id}`}
          className="font-semibold text-accent hover:underline"
        >
          {p.poNumber}
        </Link>
      ),
    },
    {
      key: "supplier",
      header: "Supplier",
      cell: (p) => <span className="text-foreground">{p.supplier.name}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (p) => (
        <Badge tone={STATUS_TONE[p.status] ?? "neutral"}>{p.status}</Badge>
      ),
    },
    {
      key: "progress",
      header: "Received",
      cell: (p) => {
        const total = p.items.reduce((s, it) => s + it.quantity, 0);
        const got = p.items.reduce((s, it) => s + it.received, 0);
        return (
          <span className="text-xs text-muted font-mono">
            {got} / {total}
          </span>
        );
      },
    },
    {
      key: "amount",
      header: "Subtotal",
      align: "right",
      cell: (p) => (
        <span className="font-semibold text-foreground">
          {formatPrice(p.subtotal)}
        </span>
      ),
    },
    {
      key: "expected",
      header: "Expected",
      cell: (p) =>
        p.expectedAt ? (
          <time className="text-xs text-muted">
            {new Date(p.expectedAt).toLocaleDateString()}
          </time>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
    {
      key: "created",
      header: "Placed",
      cell: (p) => (
        <time className="text-xs text-muted">
          {new Date(p.createdAt).toLocaleDateString()}
        </time>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Purchase orders"
        description="Stock received from suppliers"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Purchase orders" },
        ]}
        actions={
          <>
            <Button
              variant="outline"
              leftIcon={<Users className="h-4 w-4" />}
              onClick={() => setSupplierOpen(true)}
            >
              Suppliers ({suppliers?.length ?? 0})
            </Button>
            <Link
              href="/admin/purchase-orders/new"
              className="inline-flex h-10 px-4 items-center gap-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90"
            >
              <Plus className="h-4 w-4" /> New PO
            </Link>
          </>
        }
      />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !pos || pos.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No purchase orders yet"
          description="Create a purchase order to track stock coming in from your suppliers."
          action={
            suppliers && suppliers.length > 0 ? (
              <Link
                href="/admin/purchase-orders/new"
                className="inline-flex h-10 px-4 items-center gap-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90"
              >
                <Plus className="h-4 w-4" /> New PO
              </Link>
            ) : (
              <Button
                leftIcon={<Users className="h-4 w-4" />}
                onClick={() => setSupplierOpen(true)}
              >
                Add a supplier first
              </Button>
            )
          }
        />
      ) : (
        <Card>
          <DataTable columns={cols} rows={pos} keyBy={(r) => r.id} />
        </Card>
      )}

      <Modal
        open={supplierOpen}
        onClose={() => setSupplierOpen(false)}
        title="Suppliers"
        description="Manage who you buy stock from"
        size="lg"
        footer={
          <Button variant="outline" onClick={() => setSupplierOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addSupplier.mutate();
            }}
            className="space-y-3 pb-4 border-b border-card-border"
          >
            <p className="text-sm font-semibold text-foreground">
              Add a supplier
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Name"
                required
                value={supplierForm.name}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, name: e.target.value })
                }
              />
              <Input
                label="Email"
                type="email"
                value={supplierForm.email}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, email: e.target.value })
                }
              />
              <Input
                label="Phone"
                value={supplierForm.phone}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, phone: e.target.value })
                }
              />
              <Input
                label="Address"
                value={supplierForm.address}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, address: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                loading={addSupplier.isPending}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add supplier
              </Button>
            </div>
          </form>
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              Existing ({suppliers?.length ?? 0})
            </p>
            {!suppliers || suppliers.length === 0 ? (
              <p className="text-sm text-muted">None yet.</p>
            ) : (
              <ul className="divide-y divide-card-border">
                {suppliers.map((s) => (
                  <li
                    key={s.id}
                    className="py-2 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {s.name}
                      </p>
                      <p className="text-xs text-muted">
                        {s.email || s.phone || "—"}
                      </p>
                    </div>
                    {!s.isActive && (
                      <Badge tone="neutral" size="sm">
                        Inactive
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
