"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { api, TENANT_SLUG } from "@/platform/api/client";
import { useWishlist } from "@/modules/storefront/wishlist/WishlistContext";
import { Price } from "@/common/components/ui/Price";
import { Button } from "@/common/components/ui/Button";
import { EmptyState } from "@/common/components/ui/States";
import { useConfirm } from "@/common/components/ui/ConfirmDialog";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  variants: { id: string; price: string; compareAtPrice?: string | null; stockOnHand: number }[];
};

export default function WishlistPage() {
  const { ids, remove, clear, count } = useWishlist();
  const confirm = useConfirm();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => api.get(`/products?tenant=${TENANT_SLUG}&status=ACTIVE`),
    enabled: ids.length > 0,
  });

  const saved = products?.filter((p) => ids.includes(p.id)) || [];

  const clearAll = async () => {
    const ok = await confirm({
      title: "Clear wishlist?",
      description: "All saved products will be removed.",
      confirmLabel: "Clear",
      tone: "danger",
    });
    if (ok) clear();
  };

  return (
    <div>
      <div className="pb-6 border-b border-card-border mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Wishlist
          </h1>
          <p className="mt-1 text-sm text-muted">
            {count} saved item{count === 1 ? "" : "s"}
          </p>
        </div>
        {count > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Clear all
          </Button>
        )}
      </div>

      {ids.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No saved items"
          description="Tap the heart on any product to save it here for later."
          action={
            <Link
              href="/products"
              className="inline-flex h-10 px-4 items-center rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90"
            >
              Browse products
            </Link>
          }
        />
      ) : isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-card-border/40 animate-pulse"
            />
          ))}
        </div>
      ) : saved.length === 0 ? (
        <EmptyState
          title="Saved items unavailable"
          description="Items you saved appear to be out of stock or removed."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {saved.map((p) => {
            const v = p.variants[0];
            return (
              <div key={p.id} className="relative group flex flex-col">
                <button
                  onClick={() => remove(p.id)}
                  aria-label="Remove from wishlist"
                  className="absolute top-2 right-2 z-10 h-8 w-8 inline-flex items-center justify-center rounded-full bg-card-bg/90 border border-card-border text-danger hover:bg-danger/10"
                >
                  <Heart className="h-4 w-4 fill-current" />
                </button>
                <Link
                  href={`/products/${p.id}`}
                  className="flex flex-col gap-2"
                >
                  <div className="aspect-square rounded-xl border border-card-border bg-card-bg flex items-center justify-center group-hover:border-accent/40 transition-all">
                    <ShoppingBag className="h-10 w-10 text-muted/30" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                    {p.name}
                  </h3>
                  <Price
                    value={v?.price}
                    compareAt={v?.compareAtPrice}
                    size="sm"
                  />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
