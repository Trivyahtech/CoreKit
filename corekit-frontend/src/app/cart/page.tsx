"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/platform/api/client";
import Link from "next/link";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useAuth } from "@/modules/core/auth/AuthContext";
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-32 px-4">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted/30" />
        <h2 className="mt-4 text-2xl font-bold text-foreground">Your cart is empty</h2>
        <p className="mt-2 text-muted">Looks like you haven&apos;t added anything to your cart yet.</p>
        <Link
          href="/products"
          className="mt-8 inline-flex items-center px-6 py-3 text-base font-medium rounded-full shadow-sm text-white bg-accent hover:bg-accent/90 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-8">Shopping Cart</h1>

      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
        <div className="lg:col-span-7">
          <ul className="border-t border-b border-card-border divide-y divide-card-border">
            {cart.items.map((item: any) => (
              <li key={item.id} className="flex py-6 sm:py-8">
                <div className="flex-shrink-0 bg-card-bg rounded-xl border border-card-border w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 opacity-20 text-muted" />
                </div>
                <div className="ml-4 flex-1 flex flex-col justify-between sm:ml-6">
                  <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">
                        <Link href={`/products/${item.productId}`} className="hover:text-accent">
                          {item.titleSnapshot}
                        </Link>
                      </h3>
                      <p className="mt-1 text-sm text-muted">Variant: {item.variant.title}</p>
                      <p className="mt-1 text-sm font-medium text-foreground">₹{item.unitPrice}</p>
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
                        className="max-w-full rounded-lg border border-card-border bg-card-bg py-1.5 text-sm font-medium text-foreground shadow-sm focus:ring-1 focus:ring-accent focus:border-accent"
                      >
                        {[...Array(Math.min(10, item.variant.stockOnHand))].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                      <div className="absolute top-0 right-0">
                        <button
                          type="button"
                          onClick={() => removeItemMutation.mutate(item.id)}
                          className="-m-2 p-2 inline-flex text-muted hover:text-danger"
                        >
                          <span className="sr-only">Remove</span>
                          <Trash2 className="h-5 w-5" />
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
        <div className="mt-16 bg-card-bg rounded-2xl px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-5 border border-card-border">
          <h2 className="text-lg font-medium text-foreground mb-6">Order Summary</h2>
          <dl className="space-y-4 text-sm text-muted">
            <div className="flex items-center justify-between">
              <dt>Subtotal</dt>
              <dd className="font-medium text-foreground">₹{cart.subtotal}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-card-border pt-4">
              <dt>Tax (GST)</dt>
              <dd className="font-medium text-foreground">₹{cart.taxAmount}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-card-border pt-4">
              <dt>Shipping estimate</dt>
              <dd className="font-medium text-foreground">₹{cart.shippingAmount}</dd>
            </div>
            {cart.discountAmount !== "0" && (
              <div className="flex items-center justify-between border-t border-card-border pt-4">
                <dt className="text-success">Discount</dt>
                <dd className="font-medium text-success">-₹{cart.discountAmount}</dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-card-border pt-4 text-base font-bold text-foreground">
              <dt>Order Total</dt>
              <dd>₹{cart.grandTotal}</dd>
            </div>
          </dl>
          <div className="mt-8">
            <Link
              href="/checkout"
              className="w-full flex items-center justify-center p-4 rounded-xl text-base font-bold shadow-sm text-white bg-accent hover:bg-accent/90 hover:shadow-md transition-all"
            >
              Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
