"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ShoppingBag, Trash2, X } from "lucide-react";
import { api } from "@/platform/api/client";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { Button } from "@/common/components/ui/Button";
import { Price, formatPrice } from "@/common/components/ui/Price";
import { QuantityStepper } from "@/common/components/ui/QuantityStepper";
import { cn } from "@/common/utils/cn";

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
  grandTotal: string;
};

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: cart, isLoading } = useQuery<Cart>({
    queryKey: ["cart"],
    queryFn: () => api.get("/cart"),
    enabled: !!user && open,
  });

  const updateQty = useMutation({
    mutationFn: (d: { itemId: string; quantity: number }) =>
      api.patch(`/cart/items/${d.itemId}`, { quantity: d.quantity }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
  const removeItem = useMutation({
    mutationFn: (id: string) => api.delete(`/cart/items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[80]",
        !open && "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={cn(
          "absolute right-0 top-0 h-full w-full sm:w-[420px] bg-card-bg border-l border-card-border shadow-2xl flex flex-col transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center justify-between px-5 h-16 border-b border-card-border shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-accent" />
            <h2 className="font-bold text-foreground">Your cart</h2>
            {cart?.items && cart.items.length > 0 && (
              <span className="text-xs bg-accent/10 text-accent font-bold px-2 py-0.5 rounded-full">
                {cart.items.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-muted hover:bg-card-border/40 hover:text-foreground"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {!user ? (
            <div className="p-8 text-center">
              <p className="text-muted">Log in to see your cart</p>
              <Link
                href="/login?next=/cart"
                onClick={onClose}
                className="mt-4 inline-flex h-10 px-4 items-center rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90"
              >
                Sign in
              </Link>
            </div>
          ) : isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-card-border/40 animate-pulse"
                />
              ))}
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">
                Your cart is empty
              </p>
              <p className="mt-1 text-xs text-muted">
                Add some products to get started.
              </p>
              <Link
                href="/products"
                onClick={onClose}
                className="mt-5 inline-flex h-10 px-4 items-center rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90"
              >
                Browse products
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-card-border">
              {cart.items.map((it) => (
                <li key={it.id} className="p-4 flex gap-3">
                  <div className="h-16 w-16 rounded-lg border border-card-border bg-background flex items-center justify-center shrink-0">
                    <ShoppingBag className="h-6 w-6 text-muted/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <Link
                        href={`/products/${it.productId}`}
                        onClick={onClose}
                        className="text-sm font-semibold text-foreground hover:text-accent line-clamp-1"
                      >
                        {it.titleSnapshot}
                      </Link>
                      <button
                        onClick={() => removeItem.mutate(it.id)}
                        className="text-muted hover:text-danger p-0.5 -m-0.5"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted">{it.variant.title}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <QuantityStepper
                        value={it.quantity}
                        onChange={(q) =>
                          updateQty.mutate({ itemId: it.id, quantity: q })
                        }
                        min={1}
                        max={Math.max(1, it.variant.stockOnHand)}
                        size="sm"
                      />
                      <p className="text-sm font-bold text-foreground">
                        {formatPrice(Number(it.unitPrice) * it.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {user && cart && cart.items.length > 0 && (
          <footer className="p-5 border-t border-card-border space-y-3 shrink-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <Price value={cart.subtotal} size="md" />
            </div>
            <Link
              href="/checkout"
              onClick={onClose}
              className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90"
            >
              Checkout <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/cart"
              onClick={onClose}
              className="w-full inline-flex h-10 items-center justify-center rounded-lg border border-card-border text-sm font-semibold text-foreground hover:bg-card-border/30"
            >
              View full cart
            </Link>
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onClick={onClose}
            >
              Continue shopping
            </Button>
          </footer>
        )}
      </aside>
    </div>,
    document.body,
  );
}
