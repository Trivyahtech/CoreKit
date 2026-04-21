"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Clock, ShoppingBag } from "lucide-react";
import { api, TENANT_SLUG } from "@/platform/api/client";
import { useRecentlyViewed } from "@/modules/storefront/recently-viewed/useRecentlyViewed";
import { Price } from "@/common/components/ui/Price";

type Product = {
  id: string;
  name: string;
  variants: { price: string; compareAtPrice?: string | null }[];
};

export function RecentlyViewed() {
  const { ids, hydrated } = useRecentlyViewed();

  const { data } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => api.get(`/products?tenant=${TENANT_SLUG}&status=ACTIVE`),
    enabled: hydrated && ids.length > 0,
  });

  if (!hydrated || ids.length === 0) return null;
  const items = (data || []).filter((p) => ids.includes(p.id));
  // preserve order of ids
  items.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  if (items.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-accent" />
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Recently viewed
        </h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
        {items.map((p) => {
          const v = p.variants[0];
          return (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="group flex-shrink-0 w-40 sm:w-48 snap-start"
            >
              <div className="aspect-square rounded-xl border border-card-border bg-card-bg flex items-center justify-center group-hover:border-accent/40 group-hover:shadow-md transition-all">
                <ShoppingBag className="h-10 w-10 text-muted/30" />
              </div>
              <h3 className="mt-2 text-sm font-semibold text-foreground line-clamp-1">
                {p.name}
              </h3>
              <Price value={v?.price} compareAt={v?.compareAtPrice} size="sm" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
