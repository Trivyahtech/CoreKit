"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/platform/api/client";
import Link from "next/link";
import { Package, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => api.get("/orders"),
    enabled: !!user,
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-32 px-4">
        <Package className="mx-auto h-16 w-16 text-gray-300" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900">No orders yet</h2>
        <p className="mt-2 text-gray-500">You haven't placed any orders.</p>
        <Link
          href="/products"
          className="mt-8 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-10">Order History</h1>

      <div className="bg-white shadow-sm overflow-hidden sm:rounded-md border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {orders.map((order: any) => (
            <li key={order.id}>
              <Link href={`/orders/${order.id}`} className="block hover:bg-gray-50 transition-colors">
                <div className="px-4 py-6 sm:px-6 flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-indigo-600 truncate">
                        {order.orderNumber}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === "CONFIRMED" || order.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : order.status === "CANCELLED"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {order.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {order.items.length} item{order.items.length > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p className="font-medium text-gray-900 mr-4">Total: ₹{order.grandTotal}</p>
                        <p>
                          Placed on <time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleDateString()}</time>
                        </p>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
