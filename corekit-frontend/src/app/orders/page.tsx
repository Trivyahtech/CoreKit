"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Package } from "lucide-react";
import { api } from "@/platform/api/client";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { StatusBadge } from "@/common/components/ui/Badge";
import { formatPrice } from "@/common/components/ui/Price";
import {
  EmptyState,
  ErrorState,
  PageLoader,
} from "@/common/components/ui/States";

type OrderListItem = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  grandTotal: string;
  items: Array<{ id: string; quantity: number }>;
};

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login?next=/orders");
  }, [authLoading, user, router]);

  const {
    data: orders,
    isLoading,
    isError,
    refetch,
  } = useQuery<OrderListItem[]>({
    queryKey: ["orders"],
    queryFn: () => api.get("/orders"),
    enabled: !!user,
  });

  if (authLoading || isLoading) return <PageLoader />;

  return (
    <div>
      <div className="pb-6 border-b border-card-border mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          My orders
        </h1>
        <p className="mt-1 text-sm text-muted">
          Track your purchases and order status
        </p>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !orders || orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="You haven't placed any orders. Start shopping to see them here."
          action={
            <Link
              href="/products"
              className="inline-flex h-10 px-5 items-center rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent/90"
            >
              Start shopping
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const itemCount = o.items.reduce(
              (n, it) => n + it.quantity,
              0,
            );
            return (
              <li key={o.id}>
                <Link
                  href={`/orders/${o.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-card-border bg-card-bg p-4 sm:p-5 hover:border-accent/50 hover:shadow-sm transition-all"
                >
                  <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground truncate">
                        {o.orderNumber}
                      </p>
                      <StatusBadge status={o.status} kind="order" />
                      <StatusBadge
                        status={o.paymentStatus}
                        kind="payment"
                      />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
                      <span>
                        {itemCount} item{itemCount === 1 ? "" : "s"}
                      </span>
                      <span>·</span>
                      <span>
                        {new Date(o.createdAt).toLocaleDateString()}
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-foreground">
                        {formatPrice(o.grandTotal)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
