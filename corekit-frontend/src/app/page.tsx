"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { api, TENANT_SLUG } from "@/platform/api/client";
import { Price } from "@/common/components/ui/Price";
import { ProductCardSkeleton } from "@/common/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/common/components/ui/States";
import { RecentlyViewed } from "@/common/components/shop/RecentlyViewed";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  variants: { id: string; price: string; compareAtPrice?: string | null }[];
};

type Category = { id: string; name: string; slug: string };

export default function HomePage() {
  const {
    data: products,
    isLoading: loadingProducts,
    isError: productsError,
    refetch: refetchProducts,
  } = useQuery<Product[]>({
    queryKey: ["products", "home"],
    queryFn: () => api.get(`/products?tenant=${TENANT_SLUG}&status=ACTIVE`),
  });

  const {
    data: categories,
    isLoading: loadingCategories,
  } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get(`/categories?tenant=${TENANT_SLUG}`),
  });

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-amber-900 px-6 py-16 sm:px-12 sm:py-20 lg:py-24">
        <div className="absolute inset-0 opacity-10" aria-hidden>
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40L40 0H20L0 20M40 40V20L20 40" fill="none" stroke="currentColor" strokeWidth="2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-pattern)" />
          </svg>
        </div>
        <div className="relative max-w-2xl">
          <p className="text-xs uppercase tracking-widest text-amber-300 font-semibold">
            Unity · Discipline · Service
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Gear up, cadet.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-indigo-100 max-w-xl">
            Uniforms, insignia, camp badges and study material — built
            for India&apos;s NCC cadets. Parade-ready quality, cadet-friendly
            prices.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-slate-900 shadow-lg hover:bg-amber-300 transition-colors"
            >
              Shop cadet gear <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
            >
              Browse categories
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: Truck, title: "Pan-India delivery", desc: "Ships to every directorate & unit" },
          { icon: ShieldCheck, title: "Secure payments", desc: "UPI, cards, netbanking & COD" },
          { icon: ShoppingBag, title: "Cadet-grade quality", desc: "Parade-ready, washable, durable" },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-4 rounded-2xl border border-card-border bg-card-bg p-5"
          >
            <div className="h-11 w-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Shop by category
          </h2>
          <Link
            href="/categories"
            className="text-sm font-semibold text-accent hover:text-accent/80 inline-flex items-center gap-1"
          >
            Browse all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loadingCategories ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-2xl bg-card-border/40 animate-pulse"
              />
            ))}
          </div>
        ) : !categories || categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Check back soon — new categories will appear here."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.slice(0, 4).map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-card-border bg-gradient-to-br from-accent/5 to-accent/10 flex items-center justify-center p-6 text-center hover:border-accent/40 hover:shadow-md transition-all"
              >
                <div>
                  <ShoppingBag className="mx-auto h-8 w-8 text-accent/60 mb-3" />
                  <h3 className="font-bold text-foreground group-hover:text-accent transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Latest arrivals
          </h2>
          <Link
            href="/products"
            className="text-sm font-semibold text-accent hover:text-accent/80 inline-flex items-center gap-1"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : productsError ? (
          <ErrorState onRetry={() => refetchProducts()} />
        ) : !products || products.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No products yet"
            description="We're stocking the shelves. Come back soon!"
            action={
              <Link
                href="/categories"
                className="inline-flex h-10 px-4 items-center rounded-lg border border-card-border bg-card-bg text-sm font-semibold text-foreground hover:bg-card-border/30"
              >
                Browse categories
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {products.slice(0, 8).map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group flex flex-col">
                <div className="aspect-square w-full overflow-hidden rounded-xl border border-card-border bg-card-bg flex items-center justify-center group-hover:border-accent/40 group-hover:shadow-md transition-all">
                  <ShoppingBag className="h-12 w-12 text-muted/30" aria-hidden />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground line-clamp-1">
                  {p.name}
                </h3>
                <div className="mt-1">
                  <Price
                    value={p.variants?.[0]?.price}
                    compareAt={p.variants?.[0]?.compareAtPrice}
                    size="sm"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <RecentlyViewed />
    </div>
  );
}
