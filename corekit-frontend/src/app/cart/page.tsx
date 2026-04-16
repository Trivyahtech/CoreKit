"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => api.get("/cart"),
    enabled: !!user,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: (data: { itemId: string; quantity: number }) =>
      api.patch(`/cart/items/${data.itemId}`, { quantity: data.quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => api.delete(`/cart/items/${itemId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center py-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-32 px-4">
        <ShoppingBag className="mx-auto h-16 w-16 text-gray-300" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="mt-2 text-gray-500">Looks like you haven't added anything to your cart yet.</p>
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
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-10">
        Shopping Cart
      </h1>

      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-7">
          <ul className="border-t border-b border-gray-200 divide-y divide-gray-200">
            {cart.items.map((item: any) => (
              <li key={item.id} className="flex py-6 sm:py-8">
                <div className="flex-shrink-0 bg-gray-50 rounded-xl border border-gray-200 w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 opacity-20 text-gray-500" />
                </div>
                <div className="ml-4 flex-1 flex flex-col justify-between sm:ml-6">
                  <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                    <div>
                      <div className="flex justify-between">
                        <h3 className="text-sm font-medium text-gray-900">
                          <Link href={`/products/${item.productId}`} className="hover:text-indigo-600">
                            {item.titleSnapshot}
                          </Link>
                        </h3>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Variant: {item.variant.title}
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        ₹{item.unitPrice}
                      </p>
                    </div>

                    <div className="mt-4 sm:mt-0 sm:pr-9">
                      <select
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantityMutation.mutate({
                            itemId: item.id,
                            quantity: Number(e.target.value),
                          })
                        }
                        className="max-w-full rounded-md border border-gray-300 py-1.5 text-base leading-5 font-medium text-gray-700 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        {[...Array(Math.min(10, item.variant.stockOnHand))].map(
                          (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1}
                            </option>
                          )
                        )}
                      </select>

                      <div className="absolute top-0 right-0">
                        <button
                          type="button"
                          onClick={() => removeItemMutation.mutate(item.id)}
                          className="-m-2 p-2 inline-flex text-gray-400 hover:text-red-500"
                        >
                          <span className="sr-only">Remove</span>
                          <Trash2 className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Order Summary */}
        <div className="mt-16 bg-gray-50 rounded-2xl px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-5 border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Order Summary
          </h2>

          <dl className="space-y-4 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <dt>Subtotal</dt>
              <dd className="font-medium text-gray-900">₹{cart.subtotal}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt>Tax (GST)</dt>
              <dd className="font-medium text-gray-900">₹{cart.taxAmount}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt className="flex items-center text-gray-900">
                <span>Shipping estimate</span>
              </dt>
              <dd className="font-medium text-gray-900">₹{cart.shippingAmount}</dd>
            </div>
            {cart.discountAmount !== "0" && (
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="flex items-center text-emerald-600">Discount</dt>
                <dd className="font-medium text-emerald-600">-₹{cart.discountAmount}</dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-base font-bold text-gray-900">
              <dt>Order Total</dt>
              <dd>₹{cart.grandTotal}</dd>
            </div>
          </dl>

          <div className="mt-8">
            <Link
              href="/checkout"
              className="w-full flex items-center justify-center p-4 rounded-xl text-base font-bold shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-md transition-all"
            >
              Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
