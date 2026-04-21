"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Plus, Search } from "lucide-react";
import { api, TENANT_SLUG } from "@/platform/api/client";
import { AdminPageHeader } from "@/common/components/layout/AdminPageHeader";
import { Badge } from "@/common/components/ui/Badge";
import { Button } from "@/common/components/ui/Button";
import { Card } from "@/common/components/ui/Card";
import { DataTable, type Column } from "@/common/components/ui/DataTable";
import { Input } from "@/common/components/ui/Input";
import { Select } from "@/common/components/ui/FormControls";
import { Pagination } from "@/common/components/ui/Pagination";
import { formatPrice } from "@/common/components/ui/Price";
import { EmptyState, ErrorState, PageLoader } from "@/common/components/ui/States";

type Product = {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isPublished: boolean;
  createdAt: string;
  variants: { id: string; price: string; stockOnHand: number; sku: string }[];
  categories?: { category: { name: string; slug: string } }[];
};

const PAGE_SIZE = 10;

export default function AdminProductsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | Product["status"]>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery<Product[]>({
    queryKey: ["admin-products"],
    queryFn: () => api.get(`/products?tenant=${TENANT_SLUG}`),
  });

  const filtered = useMemo(() => {
    let arr = data || [];
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      arr = arr.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.slug.toLowerCase().includes(s),
      );
    }
    if (status !== "ALL") arr = arr.filter((p) => p.status === status);
    return arr;
  }, [data, q, status]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const cols: Column<Product>[] = [
    {
      key: "product",
      header: "Product",
      cell: (p) => (
        <Link
          href={`/admin/products/${p.id}`}
          className="flex items-center gap-3 group"
        >
          <div className="h-9 w-9 shrink-0 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
            <Package className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground group-hover:text-accent line-clamp-1">
              {p.name}
            </p>
            <p className="text-xs text-muted font-mono">{p.slug}</p>
          </div>
        </Link>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (p) => (
        <div className="flex flex-col gap-1">
          <Badge
            tone={
              p.status === "ACTIVE"
                ? "success"
                : p.status === "ARCHIVED"
                ? "neutral"
                : "warning"
            }
            size="sm"
          >
            {p.status}
          </Badge>
          {p.isPublished ? (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Published
            </span>
          ) : (
            <span className="text-[10px] text-muted">Unpublished</span>
          )}
        </div>
      ),
    },
    {
      key: "variants",
      header: "Variants",
      cell: (p) => (
        <p className="text-sm text-foreground">
          {p.variants.length}{" "}
          <span className="text-muted text-xs">variant{p.variants.length === 1 ? "" : "s"}</span>
        </p>
      ),
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      cell: (p) => (
        <p className="text-sm font-medium text-foreground">
          {formatPrice(p.variants[0]?.price)}
        </p>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      align: "right",
      cell: (p) => {
        const total = p.variants.reduce((a, v) => a + v.stockOnHand, 0);
        const low = total > 0 && total < 10;
        return (
          <span
            className={
              total === 0
                ? "text-danger font-semibold"
                : low
                ? "text-amber-600 dark:text-amber-400 font-semibold"
                : "text-foreground"
            }
          >
            {total}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (p) => (
        <Link
          href={`/admin/products/${p.id}`}
          className="text-xs font-semibold text-accent hover:underline"
        >
          Manage
        </Link>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description="Create and manage your catalog"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Products" },
        ]}
        actions={
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 px-4 items-center gap-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" /> New product
          </Link>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3 p-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or slug"
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
              setStatus(e.target.value as typeof status);
              setPage(1);
            }}
            className="sm:w-48"
          >
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
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
          title="No products"
          description="Get started by creating your first product."
          action={
            <Link
              href="/admin/products/new"
              className="inline-flex h-10 px-4 items-center gap-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90"
            >
              <Plus className="h-4 w-4" /> New product
            </Link>
          }
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
