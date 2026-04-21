"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Filter, ShoppingBag, X } from "lucide-react";
import { api, TENANT_SLUG } from "@/platform/api/client";
import { cn } from "@/common/utils/cn";
import { Price } from "@/common/components/ui/Price";
import { ProductCardSkeleton } from "@/common/components/ui/Skeleton";
import { EmptyState, ErrorState, PageLoader } from "@/common/components/ui/States";
import { WishlistButton } from "@/common/components/shop/WishlistButton";

type Variant = {
  id: string;
  price: string;
  compareAtPrice?: string | null;
  stockOnHand: number;
};
type ProductCategory = { category: { slug: string; name: string } };
type Product = {
  id: string;
  name: string;
  description?: string | null;
  variants: Variant[];
  categories?: ProductCategory[];
};
type Category = { id: string; name: string; slug: string };

type SortKey = "newest" | "price-asc" | "price-desc";

function sortProducts(items: Product[], key: SortKey): Product[] {
  const arr = [...items];
  if (key === "price-asc") {
    arr.sort(
      (a, b) =>
        Number(a.variants[0]?.price || 0) - Number(b.variants[0]?.price || 0),
    );
  } else if (key === "price-desc") {
    arr.sort(
      (a, b) =>
        Number(b.variants[0]?.price || 0) - Number(a.variants[0]?.price || 0),
    );
  }
  return arr;
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const q = searchParams.get("q")?.toLowerCase().trim() || "";
  const [sort, setSort] = useState<SortKey>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    data: products,
    isLoading,
    isError,
    refetch,
  } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => api.get(`/products?tenant=${TENANT_SLUG}&status=ACTIVE`),
  });

  const { data: categories, isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get(`/categories?tenant=${TENANT_SLUG}`),
  });

  const filtered = useMemo(() => {
    if (!products) return [];
    let arr = products;
    if (categoryParam) {
      arr = arr.filter((p) =>
        p.categories?.some((c) => c.category.slug === categoryParam),
      );
    }
    if (q) {
      arr = arr.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q),
      );
    }
    return sortProducts(arr, sort);
  }, [products, categoryParam, q, sort]);

  const activeCategoryName =
    categoryParam && categories?.find((c) => c.slug === categoryParam)?.name;

  const FiltersPanel = (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
          Categories
        </h3>
        <div className="space-y-1">
          <Link
            href="/products"
            className={cn(
              "block px-3 py-2 rounded-lg text-sm transition-colors",
              !categoryParam
                ? "bg-accent/10 text-accent font-semibold"
                : "text-foreground/80 hover:bg-card-border/30",
            )}
          >
            All categories
          </Link>
          {loadingCategories ? (
            <div className="space-y-2 px-3 py-1">
              <div className="h-4 w-3/4 bg-card-border/60 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-card-border/60 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-card-border/60 rounded animate-pulse" />
            </div>
          ) : (
            categories?.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm transition-colors",
                  categoryParam === c.slug
                    ? "bg-accent/10 text-accent font-semibold"
                    : "text-foreground/80 hover:bg-card-border/30",
                )}
              >
                {c.name}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-card-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {activeCategoryName || (q ? `Results for "${q}"` : "All products")}
          </h1>
          {!isLoading && (
            <p className="mt-1 text-sm text-muted">
              {filtered.length} product{filtered.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltersOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-card-border bg-card-bg text-sm font-medium text-foreground"
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
          <label className="flex items-center gap-2 text-sm text-muted">
            <span className="hidden sm:inline">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 pl-3 pr-8 border border-card-border bg-card-bg text-foreground rounded-lg text-sm focus:border-accent focus:ring-2 focus:ring-accent/25 outline-none"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </label>
        </div>
      </div>

      <div className="pt-6 lg:grid lg:grid-cols-4 lg:gap-8">
        <aside className="hidden lg:block">{FiltersPanel}</aside>

        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No products match"
              description={
                q
                  ? "Try a different search or clear your filters."
                  : "No products in this category yet."
              }
              action={
                <Link
                  href="/products"
                  className="inline-flex h-10 px-4 items-center rounded-lg border border-card-border bg-card-bg text-sm font-semibold text-foreground hover:bg-card-border/30"
                >
                  Clear filters
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
              {filtered.map((p) => {
                const variant = p.variants[0];
                const oos = variant && variant.stockOnHand === 0;
                return (
                  <div key={p.id} className="group flex flex-col relative">
                    <WishlistButton
                      productId={p.id}
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                    />
                    <Link
                      href={`/products/${p.id}`}
                      className="flex flex-col"
                    >
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-card-border bg-card-bg flex items-center justify-center group-hover:border-accent/40 group-hover:shadow-md transition-all">
                        <ShoppingBag className="h-12 w-12 text-muted/30" />
                        {oos && (
                          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-card-bg border border-card-border px-2 py-0.5 rounded-full text-muted">
                            Out of stock
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 text-sm font-semibold text-foreground line-clamp-1">
                        {p.name}
                      </h3>
                      {p.description && (
                        <p className="text-xs text-muted line-clamp-2 mt-0.5">
                          {p.description}
                        </p>
                      )}
                      <div className="mt-2">
                        <Price
                          value={variant?.price}
                          compareAt={variant?.compareAtPrice}
                          size="sm"
                        />
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setFiltersOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-72 bg-card-bg border-l border-card-border p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Filters</h2>
              <button
                onClick={() => setFiltersOpen(false)}
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-card-border/40"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {FiltersPanel}
          </aside>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProductsContent />
    </Suspense>
  );
}
