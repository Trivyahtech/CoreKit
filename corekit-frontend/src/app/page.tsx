"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { ArrowRight, ShoppingBag, ShieldCheck, Truck } from "lucide-react";

export default function HomePage() {
  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.get("/products?tenant=corekit&status=ACTIVE"),
  });

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories?tenant=corekit"),
  });

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-indigo-900 px-6 py-20 sm:px-12 sm:py-32 lg:px-16">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="hero-pattern"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M0 40L40 0H20L0 20M40 40V20L20 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-pattern)" />
          </svg>
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Next-Gen Commerce
          </h1>
          <p className="mt-6 text-lg text-indigo-200">
            Discover premium products powered by the CoreKit infrastructure.
            High-performance, modular, and built for scale.
          </p>
          <div className="mt-10 flex justify-center gap-x-6">
            <Link
              href="/products"
              className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-indigo-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-transform hover:scale-105"
            >
              Shop Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="grid grid-cols-1 gap-y-8 sm:grid-cols-3 sm:gap-x-8">
        <div className="flex items-center space-x-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="bg-indigo-100 p-3 rounded-xl border border-indigo-200">
            <Truck className="h-6 w-6 text-indigo-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Fast Delivery</h3>
            <p className="text-sm text-gray-500">Free shipping on orders over ₹500</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="bg-emerald-100 p-3 rounded-xl border border-emerald-200">
            <ShieldCheck className="h-6 w-6 text-emerald-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Secure Payments</h3>
            <p className="text-sm text-gray-500">100% secure checkout process</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="bg-amber-100 p-3 rounded-xl border border-amber-200">
            <ShoppingBag className="h-6 w-6 text-amber-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Quality Assured</h3>
            <p className="text-sm text-gray-500">30-day money-back guarantee</p>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Shop by Category
          </h2>
          <Link
            href="/categories"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
          >
            Browse all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        {loadingCategories ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-x-6 lg:gap-x-8">
            {categories?.slice(0, 4).map((category: any) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group relative block overflow-hidden rounded-2xl bg-gray-100 aspect-square border border-gray-200 hover:border-indigo-300 transition-colors"
              >
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Latest Arrivals
          </h2>
          <Link
            href="/products"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
          >
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        {loadingProducts ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
        ) : (
          <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-4 xl:gap-x-8">
            {products?.slice(0, 8).map((product: any) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group relative"
              >
                <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-xl bg-gray-50 border border-gray-200 group-hover:opacity-75 group-hover:border-indigo-300 transition-all">
                  <div className="h-64 w-full flex items-center justify-center text-gray-400 bg-gray-50">
                    <ShoppingBag className="h-12 w-12 opacity-20" />
                  </div>
                </div>
                <div className="mt-4 flex justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {product.name}
                    </h3>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    ₹{product.variants[0]?.price || '0.00'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
