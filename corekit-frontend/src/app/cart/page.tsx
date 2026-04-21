"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ShoppingBag, Tag, Trash2 } from "lucide-react";
import { api, ApiError } from "@/platform/api/client";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { Button } from "@/common/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/common/components/ui/Card";
import { Input } from "@/common/components/ui/Input";
import { Price, formatPrice } from "@/common/components/ui/Price";
import { QuantityStepper } from "@/common/components/ui/QuantityStepper";
import { PageLoader } from "@/common/components/ui/States";

type Cart = {
  items: Array<{
    id: string;
    productId: string;
    titleSnapshot: string;
    unitPrice: string;
    quantity: number;
    variant: { title: string; stockOnHand: number };
  }>;
  subtotal: string;
  taxAmount: string;
  shippingAmount: string;
  discountAmount: string;
  grandTotal: string;
  coupon?: { code: string; discountAmount: string } | null;
};

export default function CartPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login?next=/cart");
  }, [user, authLoading, router]);

  const { data: cart, isLoading } = useQuery<Cart>({
    queryKey: ["cart"],
    queryFn: () => api.get("/cart"),
    enabled: !!user,
  });

  const updateQty = useMutation({
    mutationFn: (data: { itemId: string; quantity: number }) =>
      api.patch(`/cart/items/${data.itemId}`, { quantity: data.quantity }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => api.delete(`/cart/items/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const applyCoupon = useMutation({
    mutationFn: (code: string) => api.post("/cart/coupon", { code }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      setCouponError(null);
      setCouponCode("");
    },
    onError: (err) => {
      setCouponError(
        err instanceof ApiError ? err.message : "Couldn't apply this code.",
      );
    },
  });

  if (authLoading || isLoading) return <PageLoader />;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="mx-auto h-20 w-20 rounded-full bg-accent/10 text-accent flex items-center justify-center">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">
          Your cart is empty
        </h1>
        <p className="mt-2 text-muted">
          Discover our latest products and add them to your cart.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex h-11 px-6 items-center rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent/90"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="pb-6 border-b border-card-border mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Shopping cart
        </h1>
        <p className="mt-1 text-sm text-muted">
          {cart.items.length} item{cart.items.length === 1 ? "" : "s"} in your
          cart
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
        <section className="lg:col-span-7">
          <ul className="divide-y divide-card-border border-t border-b border-card-border">
            {cart.items.map((item) => {
              const maxQty = Math.max(1, item.variant.stockOnHand);
              return (
                <li key={item.id} className="py-5 flex gap-4">
                  <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-xl border border-card-border bg-card-bg flex items-center justify-center shrink-0">
                    <ShoppingBag className="h-8 w-8 text-muted/30" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between gap-4">
                        <h3 className="text-sm sm:text-base font-semibold text-foreground">
                          <Link
                            href={`/products/${item.productId}`}
                            className="hover:text-accent"
                          >
                            {item.titleSnapshot}
                          </Link>
                        </h3>
                        <button
                          onClick={() => removeItem.mutate(item.id)}
                          className="text-muted hover:text-danger p-1 -m-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        Variant: {item.variant.title}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatPrice(item.unitPrice)} each
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(n) =>
                          updateQty.mutate({ itemId: item.id, quantity: n })
                        }
                        min={1}
                        max={maxQty}
                        size="sm"
                      />
                      <p className="text-sm font-bold text-foreground">
                        {formatPrice(
                          Number(item.unitPrice) * item.quantity,
                        )}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <Link
            href="/products"
            className="mt-6 inline-flex text-sm font-medium text-accent hover:text-accent/80"
          >
            ← Continue shopping
          </Link>
        </section>

        <aside className="lg:col-span-5 mt-8 lg:mt-0 lg:sticky lg:top-24">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Order summary
              </h2>
            </CardHeader>
            <CardBody className="space-y-5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (couponCode.trim()) applyCoupon.mutate(couponCode.trim());
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  leftIcon={<Tag className="h-4 w-4" />}
                  error={couponError || undefined}
                />
                <Button
                  type="submit"
                  variant="outline"
                  loading={applyCoupon.isPending}
                  disabled={!couponCode.trim()}
                >
                  Apply
                </Button>
              </form>

              {cart.coupon && (
                <div
                  className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 text-sm"
                  role="status"
                >
                  <span className="font-medium text-emerald-800 dark:text-emerald-300">
                    Coupon <strong>{cart.coupon.code}</strong> applied
                  </span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    −{formatPrice(cart.coupon.discountAmount)}
                  </span>
                </div>
              )}

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="font-medium text-foreground">
                    {formatPrice(cart.subtotal)}
                  </dd>
                </div>
                {Number(cart.discountAmount) > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Discount</dt>
                    <dd className="font-medium text-emerald-600 dark:text-emerald-400">
                      −{formatPrice(cart.discountAmount)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted">Tax (GST)</dt>
                  <dd className="font-medium text-foreground">
                    {formatPrice(cart.taxAmount)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Shipping</dt>
                  <dd className="font-medium text-foreground">
                    {Number(cart.shippingAmount) === 0
                      ? "Free"
                      : formatPrice(cart.shippingAmount)}
                  </dd>
                </div>
                <div className="flex justify-between pt-3 border-t border-card-border text-base">
                  <dt className="font-semibold text-foreground">Total</dt>
                  <dd className="font-bold text-foreground">
                    {formatPrice(cart.grandTotal)}
                  </dd>
                </div>
              </dl>

              <Button
                size="lg"
                fullWidth
                rightIcon={<ArrowRight className="h-5 w-5" />}
                onClick={() => router.push("/checkout")}
              >
                Proceed to checkout
              </Button>
              <p className="text-xs text-center text-muted">
                Shipping &amp; taxes calculated at checkout
              </p>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
