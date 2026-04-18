"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/platform/api/client";
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
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 px-6 py-16 sm:px-12 sm:py-24 lg:px-16">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40L40 0H20L0 20M40 40V20L20 40" fill="none" stroke="currentColor" strokeWidth="2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-pattern)" />
          </svg>
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Next-Gen Commerce
          </h1>
          <p className="mt-4 text-base text-indigo-200 sm:text-lg">
            Discover premium products powered by the CoreKit infrastructure. High-performance, modular, and built for scale.
          </p>
          <div className="mt-8 flex justify-center gap-x-4">
            <Link
              href="/products"
              className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-indigo-900 shadow-lg hover:bg-gray-100 transition-all hover:scale-105 hover:shadow-xl"
            >
              Shop Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        {[
          { icon: Truck, title: "Fast Delivery", desc: "Free shipping on orders over ₹500", color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-400" },
          { icon: ShieldCheck, title: "Secure Payments", desc: "100% secure checkout process", color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400" },
          { icon: ShoppingBag, title: "Quality Assured", desc: "30-day money-back guarantee", color: "text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400" },
        ].map((item) => (
          <div key={item.title} className="flex items-center gap-4 bg-card-bg p-5 rounded-xl border border-card-border hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-xl ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Featured Categories */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Shop by Category</h2>
          <Link href="/categories" className="text-sm font-medium text-accent hover:text-accent/80 flex items-center gap-1">
            Browse all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loadingCategories ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" /></div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {categories?.slice(0, 4).map((category: any) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group relative block overflow-hidden rounded-xl bg-card-bg aspect-square border border-card-border hover:border-accent/50 hover:shadow-lg transition-all"
              >
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Latest Arrivals</h2>
          <Link href="/products" className="text-sm font-medium text-accent hover:text-accent/80 flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loadingProducts ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products?.slice(0, 8).map((product: any) => (
              <Link key={product.id} href={`/products/${product.id}`} className="group">
                <div className="aspect-square w-full overflow-hidden rounded-xl bg-card-bg border border-card-border group-hover:border-accent/50 group-hover:shadow-lg transition-all">
                  <div className="h-full w-full flex items-center justify-center text-muted">
                    <ShoppingBag className="h-12 w-12 opacity-20" />
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-start">
                  <h3 className="text-sm font-medium text-foreground">{product.name}</h3>
                  <p className="text-sm font-bold text-foreground">₹{product.variants[0]?.price || "0.00"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
