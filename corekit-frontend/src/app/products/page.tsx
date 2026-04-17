"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/platform/api/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShoppingBag, Filter } from "lucide-react";
import { Suspense } from "react";

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["products", categoryParam],
    queryFn: () => api.get(`/products?tenant=corekit&status=ACTIVE`),
  });

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories?tenant=corekit"),
  });

  const filteredProducts = categoryParam
    ? products?.filter((p: any) =>
        p.categories?.some((c: any) => c.category.slug === categoryParam)
      )
    : products;

  return (
    <div className="py-4">
      <div className="flex items-center justify-between border-b border-card-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {categoryParam
            ? categories?.find((c: any) => c.slug === categoryParam)?.name || "Category"
            : "All Products"}
        </h1>
      </div>

      <div className="pt-6 lg:grid lg:grid-cols-4 lg:gap-x-8">
        {/* Filters sidebar */}
        <aside className="hidden lg:block">
          <div className="flex items-center space-x-2 pb-4">
            <Filter className="h-4 w-4 text-muted" />
            <h2 className="text-base font-medium text-foreground">Category Filters</h2>
          </div>
          <div className="space-y-3">
            <Link
              href="/products"
              className={`block text-sm ${
                !categoryParam ? "font-semibold text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              All Categories
            </Link>
            {loadingCategories ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-card-border rounded w-3/4" />
                <div className="h-4 bg-card-border rounded w-1/2" />
              </div>
            ) : (
              categories?.map((category: any) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className={`block text-sm ${
                    categoryParam === category.slug
                      ? "font-semibold text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {category.name}
                </Link>
              ))
            )}
          </div>
        </aside>

        {/* Product grid */}
        <div className="mt-6 lg:col-span-3 lg:mt-0">
          {loadingProducts ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" /></div>
          ) : filteredProducts?.length === 0 ? (
            <div className="text-center py-20 bg-card-bg rounded-xl border border-card-border border-dashed">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted/30" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">No products</h3>
              <p className="mt-1 text-sm text-muted">We couldn&apos;t find any products in this category.</p>
              <div className="mt-6">
                <Link href="/products" className="text-accent hover:text-accent/80 font-medium text-sm">
                  Clear filters
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts?.map((product: any) => (
                <Link key={product.id} href={`/products/${product.id}`} className="group flex flex-col">
                  <div className="aspect-square w-full overflow-hidden rounded-xl bg-card-bg border border-card-border group-hover:border-accent/50 group-hover:shadow-lg transition-all">
                    <div className="h-full flex items-center justify-center text-muted">
                      <ShoppingBag className="h-12 w-12 opacity-20" />
                    </div>
                  </div>
                  <div className="mt-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">{product.name}</h3>
                      <p className="mt-1 text-sm text-muted line-clamp-2">
                        {product.description || "Premium product by CoreKit"}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-base font-bold text-foreground">₹{product.variants[0]?.price || "0.00"}</p>
                      <span className="text-xs bg-accent-light text-accent px-3 py-1.5 rounded-full font-medium group-hover:bg-accent group-hover:text-white transition-colors">
                        View Details
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
