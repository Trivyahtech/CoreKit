"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, Search, User } from "lucide-react";
import { api } from "@/platform/api/client";
import { AdminPageHeader } from "@/common/components/layout/AdminPageHeader";
import { Badge } from "@/common/components/ui/Badge";
import { Card } from "@/common/components/ui/Card";
import { DataTable, type Column } from "@/common/components/ui/DataTable";
import { Input } from "@/common/components/ui/Input";
import { Pagination } from "@/common/components/ui/Pagination";
import { formatPrice } from "@/common/components/ui/Price";
import {
  EmptyState,
  ErrorState,
  PageLoader,
} from "@/common/components/ui/States";

type Customer = {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string | null;
  status: string;
  emailVerifiedAt?: string | null;
  createdAt: string;
  ordersCount: number;
  lifetimeValue: string;
  lastOrderAt: string | null;
};

const PAGE_SIZE = 15;

export default function AdminCustomersPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery<Customer[]>({
    queryKey: ["admin-customers", q],
    queryFn: () =>
      api.get(`/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  });

  const paged = useMemo(
    () => (data || []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [data, page],
  );

  const cols: Column<Customer>[] = [
    {
      key: "customer",
      header: "Customer",
      cell: (c) => (
        <Link
          href={`/admin/customers/${c.id}`}
          className="flex items-center gap-3 group"
        >
          <div className="h-9 w-9 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold shrink-0">
            {(c.firstName[0] || "?").toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground group-hover:text-accent">
              {c.firstName} {c.lastName}
            </p>
            <p className="text-xs text-muted truncate">{c.email}</p>
          </div>
        </Link>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      cell: (c) => (
        <span className="text-xs text-muted">
          {c.phone || "—"}
          {c.emailVerifiedAt ? (
            <Badge tone="success" size="sm" className="ml-2">
              Verified
            </Badge>
          ) : (
            <Badge tone="warning" size="sm" className="ml-2">
              Unverified
            </Badge>
          )}
        </span>
      ),
    },
    {
      key: "orders",
      header: "Orders",
      align: "right",
      cell: (c) => <span className="text-foreground">{c.ordersCount}</span>,
    },
    {
      key: "ltv",
      header: "Lifetime value",
      align: "right",
      cell: (c) => (
        <span className="font-semibold text-foreground">
          {formatPrice(c.lifetimeValue)}
        </span>
      ),
    },
    {
      key: "last",
      header: "Last order",
      cell: (c) =>
        c.lastOrderAt ? (
          <time className="text-xs text-muted" dateTime={c.lastOrderAt}>
            {new Date(c.lastOrderAt).toLocaleDateString()}
          </time>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
    {
      key: "joined",
      header: "Joined",
      cell: (c) => (
        <time className="text-xs text-muted" dateTime={c.createdAt}>
          {new Date(c.createdAt).toLocaleDateString()}
        </time>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Customers"
        description="All customers with purchase history"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Customers" },
        ]}
      />

      <Card className="mb-4">
        <div className="p-4">
          <Input
            placeholder="Search by name, email, phone"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </Card>

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={User}
          title="No customers"
          description="Customers will appear here once they sign up or place an order."
        />
      ) : (
        <>
          <DataTable columns={cols} rows={paged} keyBy={(r) => r.id} />
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={data.length}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
