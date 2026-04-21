"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { api, TENANT_SLUG } from "@/platform/api/client";
import { AdminPageHeader } from "@/common/components/layout/AdminPageHeader";
import { Card } from "@/common/components/ui/Card";
import { StatusBadge } from "@/common/components/ui/Badge";
import { formatPrice } from "@/common/components/ui/Price";
import { Skeleton } from "@/common/components/ui/Skeleton";
import { useAuth } from "@/modules/core/auth/AuthContext";

type Product = { id: string; isPublished: boolean; status: string };
type OrderListItem = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  grandTotal: string;
  createdAt: string;
};
type User = { id: string; role: string; createdAt: string };

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const { data: products, isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ["admin-products"],
    queryFn: () => api.get(`/products?tenant=${TENANT_SLUG}`),
  });

  const { data: orders, isLoading: loadingOrders } = useQuery<OrderListItem[]>({
    queryKey: ["admin-orders"],
    queryFn: () => api.get("/orders?scope=tenant"),
  });

  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: () => api.get(`/users?tenant=${TENANT_SLUG}`),
  });

  const stats = useMemo(() => {
    const totalRevenue = (orders || [])
      .filter(
        (o) =>
          o.paymentStatus === "CAPTURED" &&
          !["CANCELLED", "REFUNDED"].includes(o.status),
      )
      .reduce((sum, o) => sum + Number(o.grandTotal || 0), 0);

    const activeOrders = (orders || []).filter(
      (o) => !["COMPLETED", "CANCELLED", "REFUNDED"].includes(o.status),
    ).length;

    const publishedProducts = (products || []).filter(
      (p) => p.isPublished && p.status === "ACTIVE",
    ).length;

    return {
      totalRevenue,
      activeOrders,
      totalOrders: orders?.length || 0,
      totalUsers: users?.length || 0,
      publishedProducts,
      totalProducts: products?.length || 0,
    };
  }, [orders, products, users]);

  const recentOrders = useMemo(
    () => (orders || []).slice(0, 6),
    [orders],
  );

  return (
    <div>
      <AdminPageHeader
        title={`Hi, ${user?.firstName || "there"}`}
        description="Here's what's happening in your store today"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Revenue (captured)"
          value={formatPrice(stats.totalRevenue)}
          loading={loadingOrders}
          icon={DollarSign}
          tone="emerald"
        />
        <StatCard
          label="Active orders"
          value={String(stats.activeOrders)}
          sub={`of ${stats.totalOrders} total`}
          loading={loadingOrders}
          icon={ShoppingCart}
          tone="indigo"
        />
        <StatCard
          label="Registered users"
          value={String(stats.totalUsers)}
          loading={loadingUsers}
          icon={Users}
          tone="purple"
        />
        <StatCard
          label="Products published"
          value={String(stats.publishedProducts)}
          sub={`of ${stats.totalProducts} total`}
          loading={loadingProducts}
          icon={Package}
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 overflow-hidden">
          <div className="px-5 py-4 border-b border-card-border flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Recent orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-accent hover:text-accent/80 inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {loadingOrders ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted">
              No orders yet.
            </div>
          ) : (
            <ul className="divide-y divide-card-border">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-card-border/15 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground text-sm truncate">
                        {o.orderNumber}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {new Date(o.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={o.status} kind="order" />
                    <p className="font-semibold text-foreground min-w-[5rem] text-right">
                      {formatPrice(o.grandTotal)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-card-border">
            <h2 className="text-base font-semibold text-foreground">
              Quick actions
            </h2>
          </div>
          <div className="p-2">
            <QuickAction
              href="/admin/products/new"
              icon={Package}
              title="Add product"
              desc="Create a new catalog item"
            />
            <QuickAction
              href="/admin/orders"
              icon={ShoppingCart}
              title="Manage orders"
              desc="Update statuses &amp; refunds"
            />
            <QuickAction
              href="/admin/users"
              icon={UserPlus}
              title="Manage users"
              desc="Assign roles &amp; permissions"
            />
            <QuickAction
              href="/admin/shipping"
              icon={TrendingUp}
              title="Shipping rules"
              desc="Zones &amp; rate configuration"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  loading,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  loading?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  tone: "emerald" | "indigo" | "purple" | "amber";
}) {
  const toneCls = {
    emerald:
      "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400",
    indigo:
      "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-400",
    purple:
      "text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-400",
    amber:
      "text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400",
  }[tone];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${toneCls}`}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted opacity-40" />
      </div>
      {loading ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <h3 className="text-2xl font-bold text-foreground">{value}</h3>
      )}
      <p className="text-xs text-muted mt-1">{label}</p>
      {sub && <p className="text-xs text-muted/80 mt-0.5">{sub}</p>}
    </Card>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-card-border/30 transition-colors"
    >
      <div className="h-9 w-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p
          className="text-xs text-muted mt-0.5"
          dangerouslySetInnerHTML={{ __html: desc }}
        />
      </div>
      <ArrowRight className="h-4 w-4 text-muted mt-1" />
    </Link>
  );
}
