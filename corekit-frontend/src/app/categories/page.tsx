"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/platform/api/client";
import Link from "next/link";
import { Folder } from "lucide-react";

export default function CategoriesPage() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories?tenant=corekit"),
  });

  return (
    <div className="pt-8 pb-16">
      <div className="flex items-center justify-between border-b border-gray-200 pb-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          All Categories
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : categories?.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
          <Folder className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No categories</h3>
          <p className="mt-1 text-sm text-gray-500">
            Check back later for new product categories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 xl:gap-x-8">
          {categories?.map((category: any) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group relative flex flex-col justify-end overflow-hidden rounded-2xl bg-gray-100 px-8 pb-8 pt-40 border border-gray-200 hover:border-indigo-400 transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent group-hover:from-indigo-900/90 transition-colors" />
              <h3 className="relative text-2xl font-bold text-white tracking-tight">
                {category.name}
              </h3>
              <p className="relative mt-2 text-sm text-gray-300 group-hover:text-white transition-colors">
                Explore {category.name}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
