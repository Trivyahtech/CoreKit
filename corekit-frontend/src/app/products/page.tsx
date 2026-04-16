"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
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
    <div className="pt-8 pb-16">
      <div className="flex items-center justify-between border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {categoryParam
            ? categories?.find((c: any) => c.slug === categoryParam)?.name || "Category"
            : "All Products"}
        </h1>
      </div>

      <div className="pt-6 lg:grid lg:grid-cols-4 lg:gap-x-8">
        {/* Filters sidebar */}
        <aside className="hidden lg:block">
          <div className="flex items-center space-x-2 pb-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Category Filters</h2>
          </div>
          <div className="space-y-4">
            <Link
              href="/products"
              className={`block text-sm ${
                !categoryParam ? "font-semibold text-indigo-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Categories
            </Link>
            {loadingCategories ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : (
              categories?.map((category: any) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className={`block text-sm ${
                    categoryParam === category.slug
                      ? "font-semibold text-indigo-600"
                      : "text-gray-600 hover:text-gray-900"
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
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
          ) : filteredProducts?.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No products</h3>
              <p className="mt-1 text-sm text-gray-500">
                We couldn't find any products in this category.
              </p>
              <div className="mt-6">
                <Link href="/products" className="text-indigo-600 hover:text-indigo-500 font-medium text-sm">
                  Clear filters
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
              {filteredProducts?.map((product: any) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group relative flex flex-col"
                >
                  <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-xl bg-gray-50 border border-gray-200 group-hover:opacity-75 group-hover:border-indigo-300 transition-all">
                    <div className="h-64 flex items-center justify-center text-gray-400">
                      <ShoppingBag className="h-12 w-12 opacity-20" />
                    </div>
                  </div>
                  <div className="mt-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {product.description || "Premium product by CoreKit"}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-base font-bold text-gray-900">
                        ₹{product.variants[0]?.price || "0.00"}
                      </p>
                      <button className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-medium group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        View Details
                      </button>
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
    <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
      <ProductsContent />
    </Suspense>
  );
}
