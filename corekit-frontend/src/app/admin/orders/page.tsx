"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Package, Search } from "lucide-react";
import { api } from "@/platform/api/client";
import { AdminPageHeader } from "@/common/components/layout/AdminPageHeader";
import { Badge, StatusBadge } from "@/common/components/ui/Badge";
import { Card } from "@/common/components/ui/Card";
import { DataTable, type Column } from "@/common/components/ui/DataTable";
import { Input } from "@/common/components/ui/Input";
import { Select } from "@/common/components/ui/FormControls";
import { Pagination } from "@/common/components/ui/Pagination";
import { formatPrice } from "@/common/components/ui/Price";
import {
  EmptyState,
  ErrorState,
  PageLoader,
} from "@/common/components/ui/States";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  grandTotal: string;
  createdAt: string;
  items: Array<{ quantity: number }>;
};

const PAGE_SIZE = 12;
const STATUSES = [
  "CREATED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

export default function AdminOrdersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery<Order[]>({
    queryKey: ["admin-orders"],
    queryFn: () => api.get("/orders?scope=tenant"),
  });

  const filtered = useMemo(() => {
    let arr = data || [];
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      arr = arr.filter((o) => o.orderNumber.toLowerCase().includes(s));
    }
    if (status !== "ALL") arr = arr.filter((o) => o.status === status);
    return arr;
  }, [data, q, status]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const cols: Column<Order>[] = [
    {
      key: "order",
      header: "Order",
      cell: (o) => (
        <Link
          href={`/admin/orders/${o.id}`}
          className="font-semibold text-accent hover:underline"
        >
          {o.orderNumber}
        </Link>
      ),
    },
    {
      key: "items",
      header: "Items",
      cell: (o) => {
        const n = o.items.reduce((a, it) => a + it.quantity, 0);
        return <span className="text-foreground">{n}</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (o) => <StatusBadge status={o.status} kind="order" />,
    },
    {
      key: "payment",
      header: "Payment",
      cell: (o) => <StatusBadge status={o.paymentStatus} kind="payment" />,
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      cell: (o) => (
        <span className="font-semibold text-foreground">
          {formatPrice(o.grandTotal)}
        </span>
      ),
    },
    {
      key: "date",
      header: "Placed",
      cell: (o) => (
        <time className="text-xs text-muted" dateTime={o.createdAt}>
          {new Date(o.createdAt).toLocaleDateString()}
        </time>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (o) => (
        <Link
          href={`/admin/orders/${o.id}`}
          className="text-xs font-semibold text-accent hover:underline"
        >
          Open
        </Link>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        description="Manage order lifecycle and fulfilment"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Orders" },
        ]}
      />

      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3 p-4">
          <div className="flex-1">
            <Input
              placeholder="Search by order number"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="sm:w-48"
          >
            <option value="ALL">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders"
          description="Orders will appear here once customers place them."
        />
      ) : (
        <>
          <DataTable columns={cols} rows={paged} keyBy={(r) => r.id} />
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
