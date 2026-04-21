"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Folder, ShoppingBag } from "lucide-react";
import { api, TENANT_SLUG } from "@/platform/api/client";
import { Skeleton } from "@/common/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/common/components/ui/States";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

export default function CategoriesPage() {
  const {
    data: categories,
    isLoading,
    isError,
    refetch,
  } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get(`/categories?tenant=${TENANT_SLUG}`),
  });

  return (
    <div>
      <div className="pb-6 border-b border-card-border">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          All categories
        </h1>
        <p className="mt-1 text-sm text-muted">
          Browse our collections by category.
        </p>
      </div>

      <div className="pt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !categories || categories.length === 0 ? (
          <EmptyState
            icon={Folder}
            title="No categories"
            description="Categories will appear here once products are added."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-card-border bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/5 flex items-end p-6 hover:border-accent/50 hover:shadow-md transition-all"
              >
                <div className="absolute top-5 right-5 h-10 w-10 rounded-full bg-card-bg/80 backdrop-blur flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-accent" aria-hidden />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors">
                    {c.name}
                  </h3>
                  {c.description && (
                    <p className="mt-1 text-sm text-muted line-clamp-2">
                      {c.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
