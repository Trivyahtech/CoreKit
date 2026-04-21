"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCircle2,
  CreditCard,
  MapPin,
  Plus,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import { api, ApiError } from "@/platform/api/client";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { Button } from "@/common/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/common/components/ui/Card";
import { Input } from "@/common/components/ui/Input";
import { formatPrice } from "@/common/components/ui/Price";
import { PageLoader } from "@/common/components/ui/States";
import { useToast } from "@/common/components/ui/Toast";
import { cn } from "@/common/utils/cn";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

type Cart = {
  items: Array<{
    id: string;
    titleSnapshot: string;
    quantity: number;
    variant?: { weightGrams?: number | null };
  }>;
  subtotal: string;
  taxAmount: string;
  shippingAmount: string;
  discountAmount: string;
  grandTotal: string;
};

type ShippingQuote = {
  ruleId: string;
  name: string;
  method: string;
  cost: number;
  isCodAllowed: boolean;
  estimated?: string | null;
};

type PaymentMethod = "RAZORPAY" | "COD";

const STEPS = [
  { id: 1, label: "Address" },
  { id: 2, label: "Shipping & Payment" },
  { id: 3, label: "Review" },
];

export default function CheckoutPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [addressId, setAddressId] = useState<string>("");
  const [shippingRuleId, setShippingRuleId] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod>("COD");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    fullName:
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login?next=/checkout");
  }, [user, authLoading, router]);

  const { data: cart } = useQuery<Cart>({
    queryKey: ["cart"],
    queryFn: () => api.get("/cart"),
    enabled: !!user,
  });

  const { data: paymentProviders } = useQuery<{
    providers: Array<{ id: string; name: string; enabled: boolean }>;
  }>({
    queryKey: ["payment-providers"],
    queryFn: () => api.get("/payments/providers"),
    staleTime: 10 * 60 * 1000,
  });

  const razorpayEnabled =
    paymentProviders?.providers.find((p) => p.id === "RAZORPAY")?.enabled ??
    false;

  const { data: addresses, isLoading: loadingAddresses } = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: () => api.get("/addresses"),
    enabled: !!user,
  });

  useEffect(() => {
    if (!addressId && addresses && addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setAddressId(def.id);
    }
    if (addresses && addresses.length === 0) {
      setShowNew(true);
    }
  }, [addresses, addressId]);

  const selectedAddress = useMemo(
    () => addresses?.find((a) => a.id === addressId),
    [addresses, addressId],
  );

  const totalWeightGrams = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce(
      (sum, it) => sum + (it.variant?.weightGrams ?? 0) * it.quantity,
      0,
    );
  }, [cart]);

  const {
    data: quotes,
    isLoading: loadingQuotes,
    isError: quoteError,
    error: quoteErr,
    refetch: refetchQuotes,
  } = useQuery<ShippingQuote[]>({
    queryKey: ["shipping-quote", selectedAddress?.pincode, totalWeightGrams, cart?.subtotal],
    queryFn: () =>
      api.post("/shipping/quote", {
        pincode: selectedAddress!.pincode,
        weightGrams: totalWeightGrams,
        orderValue: Number(cart!.subtotal),
      }),
    enabled: !!selectedAddress?.pincode && !!cart && step >= 2,
    retry: false,
  });

  useEffect(() => {
    if (quotes && quotes.length > 0 && !shippingRuleId) {
      // pick cheapest
      const cheapest = [...quotes].sort((a, b) => a.cost - b.cost)[0];
      setShippingRuleId(cheapest.ruleId);
    }
  }, [quotes, shippingRuleId]);

  const selectedQuote = useMemo(
    () => quotes?.find((q) => q.ruleId === shippingRuleId),
    [quotes, shippingRuleId],
  );

  // If current shipping rule doesn't allow COD, switch to online (if available)
  useEffect(() => {
    if (selectedQuote && !selectedQuote.isCodAllowed && method === "COD") {
      if (razorpayEnabled) setMethod("RAZORPAY");
    }
  }, [selectedQuote, method, razorpayEnabled]);

  // Reset to COD if Razorpay is selected but not enabled
  useEffect(() => {
    if (method === "RAZORPAY" && paymentProviders && !razorpayEnabled) {
      setMethod("COD");
    }
  }, [method, paymentProviders, razorpayEnabled]);

  const addAddress = useMutation({
    mutationFn: (data: typeof form) =>
      api.post("/addresses", {
        ...data,
        type: "SHIPPING",
        isDefault: !addresses || addresses.length === 0,
      }),
    onSuccess: (newAddr: Address) => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      setAddressId(newAddr.id);
      setShowNew(false);
      toast({ variant: "success", title: "Address saved" });
    },
    onError: (err) => {
      toast({
        variant: "error",
        title: "Couldn't save address",
        description:
          err instanceof ApiError ? err.message : "Please try again.",
      });
    },
  });

  const placeOrder = useMutation({
    mutationFn: async () => {
      const order = await api.post("/orders", {
        billingAddressId: addressId,
        shippingAddressId: addressId,
        shippingRuleId,
        weightGrams: totalWeightGrams || undefined,
      });
      const payment = await api.post("/payments", {
        orderId: order.id,
        provider: method,
        method,
      });
      return { order, payment };
    },
    onSuccess: ({ order, payment }) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      if (method === "COD") {
        router.push(`/orders/${order.id}?placed=1`);
        return;
      }
      // Online payment flow: Razorpay expects a gateway-order + SDK.
      // In this environment, the backend fabricates a `gw_*` order id
      // without real Razorpay keys; verification will fail. We redirect
      // the user to the order page and explain the state.
      toast({
        variant: "info",
        title: "Order placed — waiting on payment",
        description:
          "Online payments require a configured Razorpay account. Complete on the order page.",
      });
      router.push(`/orders/${order.id}?placed=1&pay=pending`);
    },
    onError: (err) => {
      setOrderError(
        err instanceof ApiError ? err.message : "Failed to place order.",
      );
    },
  });

  useEffect(() => {
    if (cart && cart.items.length === 0) {
      router.replace("/cart");
    }
  }, [cart, router]);

  if (authLoading || !cart) return <PageLoader />;

  const quoteErrorMsg =
    quoteError && quoteErr instanceof ApiError
      ? quoteErr.status === 404
        ? `We don't ship to ${selectedAddress?.pincode} yet.`
        : quoteErr.message
      : null;

  const canAdvanceToPayment = !!addressId && !showNew;
  const canAdvanceToReview =
    !!shippingRuleId && !!selectedQuote && !quoteError;

  const totalWithShipping = cart
    ? Number(cart.subtotal) +
      Number(cart.taxAmount) -
      Number(cart.discountAmount) +
      (selectedQuote?.cost ?? 0)
    : 0;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="pb-4 border-b border-card-border mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Checkout
        </h1>
      </div>

      <ol
        className="mb-8 flex items-center"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={3}
      >
        {STEPS.map((s, idx) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <li key={s.id} className="flex items-center flex-1">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors",
                    done
                      ? "bg-accent border-accent text-white"
                      : active
                      ? "border-accent text-accent bg-accent/10"
                      : "border-card-border text-muted bg-card-bg",
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : s.id}
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold hidden sm:inline",
                    active || done ? "text-foreground" : "text-muted",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {idx !== STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-3",
                    done ? "bg-accent" : "bg-card-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1 — ADDRESS */}
          <Card>
            <CardHeader className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-accent" />
              <h2 className="text-base font-semibold text-foreground">
                Shipping address
              </h2>
            </CardHeader>
            <CardBody>
              {loadingAddresses ? (
                <div className="h-20 rounded-xl bg-card-border/50 animate-pulse" />
              ) : showNew ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addAddress.mutate(form);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full name"
                      required
                      value={form.fullName}
                      onChange={(e) =>
                        setForm({ ...form, fullName: e.target.value })
                      }
                    />
                    <Input
                      label="Phone"
                      required
                      inputMode="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                    />
                  </div>
                  <Input
                    label="Address line 1"
                    required
                    value={form.line1}
                    onChange={(e) =>
                      setForm({ ...form, line1: e.target.value })
                    }
                  />
                  <Input
                    label="Address line 2 (optional)"
                    value={form.line2}
                    onChange={(e) =>
                      setForm({ ...form, line2: e.target.value })
                    }
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="City"
                      required
                      value={form.city}
                      onChange={(e) =>
                        setForm({ ...form, city: e.target.value })
                      }
                    />
                    <Input
                      label="State"
                      required
                      value={form.state}
                      onChange={(e) =>
                        setForm({ ...form, state: e.target.value })
                      }
                    />
                    <Input
                      label="PIN code"
                      required
                      inputMode="numeric"
                      value={form.pincode}
                      onChange={(e) =>
                        setForm({ ...form, pincode: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    {addresses && addresses.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNew(false)}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" loading={addAddress.isPending}>
                      Save address
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  {addresses?.map((a) => {
                    const selected = a.id === addressId;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setAddressId(a.id);
                          setShippingRuleId("");
                        }}
                        className={cn(
                          "w-full text-left rounded-xl border-2 p-4 transition-colors",
                          selected
                            ? "border-accent bg-accent/5"
                            : "border-card-border bg-card-bg hover:border-accent/40",
                        )}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <p className="font-semibold text-foreground">
                              {a.fullName} · {a.phone}
                            </p>
                            <p className="text-sm text-muted mt-1">
                              {a.line1}
                              {a.line2 ? `, ${a.line2}` : ""}
                            </p>
                            <p className="text-sm text-muted">
                              {a.city}, {a.state} {a.pincode}
                            </p>
                          </div>
                          {selected && (
                            <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowNew(true)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-accent/80"
                  >
                    <Plus className="h-4 w-4" /> Add new address
                  </button>
                </div>
              )}
              {step === 1 && (
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!canAdvanceToPayment}
                  >
                    Continue to shipping &amp; payment
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          {/* STEP 2 — SHIPPING + PAYMENT */}
          {step >= 2 && (
            <>
              <Card>
                <CardHeader className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-accent" />
                  <h2 className="text-base font-semibold text-foreground">
                    Shipping method
                  </h2>
                </CardHeader>
                <CardBody>
                  {loadingQuotes ? (
                    <div className="h-20 rounded-xl bg-card-border/50 animate-pulse" />
                  ) : quoteError ? (
                    <div
                      className="bg-danger/10 text-danger px-3 py-3 rounded-lg text-sm"
                      role="alert"
                    >
                      {quoteErrorMsg}{" "}
                      <button
                        className="underline font-semibold"
                        onClick={() => refetchQuotes()}
                      >
                        Retry
                      </button>
                    </div>
                  ) : !quotes || quotes.length === 0 ? (
                    <p className="text-sm text-muted">
                      No shipping methods available for this address.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {quotes.map((q) => {
                        const selected = q.ruleId === shippingRuleId;
                        return (
                          <button
                            key={q.ruleId}
                            type="button"
                            onClick={() => setShippingRuleId(q.ruleId)}
                            className={cn(
                              "w-full text-left flex items-center gap-3 rounded-xl border-2 p-4 transition-colors",
                              selected
                                ? "border-accent bg-accent/5"
                                : "border-card-border bg-card-bg hover:border-accent/40",
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground">
                                {q.name}
                                {!q.isCodAllowed && (
                                  <span className="ml-2 text-[10px] uppercase tracking-wider font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                                    Prepaid only
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted mt-0.5">
                                {q.method}
                                {q.estimated ? ` · ${q.estimated}` : ""}
                              </p>
                            </div>
                            <div className="text-sm font-bold text-foreground whitespace-nowrap">
                              {q.cost === 0 ? "Free" : formatPrice(q.cost)}
                            </div>
                            {selected && (
                              <CheckCircle2 className="h-5 w-5 text-accent" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-accent" />
                  <h2 className="text-base font-semibold text-foreground">
                    Payment method
                  </h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {razorpayEnabled && (
                      <button
                        type="button"
                        onClick={() => setMethod("RAZORPAY")}
                        className={cn(
                          "w-full text-left flex items-start gap-3 rounded-xl border-2 p-4 transition-colors",
                          method === "RAZORPAY"
                            ? "border-accent bg-accent/5"
                            : "border-card-border bg-card-bg hover:border-accent/40",
                        )}
                      >
                        <CreditCard className="h-5 w-5 mt-0.5 text-accent shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            Online payment
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            UPI, cards, netbanking &amp; wallets via Razorpay
                          </p>
                        </div>
                        {method === "RAZORPAY" && (
                          <CheckCircle2 className="h-5 w-5 text-accent" />
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setMethod("COD")}
                      disabled={selectedQuote && !selectedQuote.isCodAllowed}
                      className={cn(
                        "w-full text-left flex items-start gap-3 rounded-xl border-2 p-4 transition-colors",
                        method === "COD"
                          ? "border-accent bg-accent/5"
                          : "border-card-border bg-card-bg hover:border-accent/40",
                        selectedQuote &&
                          !selectedQuote.isCodAllowed &&
                          "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <Wallet className="h-5 w-5 mt-0.5 text-accent shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">
                          Cash on delivery
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          {selectedQuote && !selectedQuote.isCodAllowed
                            ? "Not available for this shipping method"
                            : "Pay with cash when your order arrives"}
                        </p>
                      </div>
                      {method === "COD" && (
                        <CheckCircle2 className="h-5 w-5 text-accent" />
                      )}
                    </button>
                  </div>

                  <div className="mt-6 flex justify-between">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      disabled={!canAdvanceToReview}
                    >
                      Review order
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </>
          )}

          {/* STEP 3 — REVIEW */}
          {step >= 3 && (
            <Card>
              <CardHeader className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <h2 className="text-base font-semibold text-foreground">
                  Review &amp; place order
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Shipping to
                    </p>
                    {selectedAddress && (
                      <p className="mt-1 text-foreground">
                        <span className="font-semibold">
                          {selectedAddress.fullName}
                        </span>
                        {" · "}
                        {selectedAddress.line1},{" "}
                        {selectedAddress.city}, {selectedAddress.state}{" "}
                        {selectedAddress.pincode}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Delivery
                    </p>
                    <p className="mt-1 text-foreground">
                      {selectedQuote
                        ? `${selectedQuote.name} · ${
                            selectedQuote.cost === 0
                              ? "Free"
                              : formatPrice(selectedQuote.cost)
                          }`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Paying with
                    </p>
                    <p className="mt-1 text-foreground">
                      {method === "COD" ? "Cash on delivery" : "Online payment"}
                    </p>
                  </div>
                </div>

                {orderError && (
                  <p className="mt-4 text-sm text-danger" role="alert">
                    {orderError}
                  </p>
                )}

                <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button
                    size="lg"
                    loading={placeOrder.isPending}
                    onClick={() => placeOrder.mutate()}
                  >
                    Place order · {formatPrice(totalWithShipping)}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <aside className="lg:col-span-4 lg:sticky lg:top-24">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Order summary
              </h2>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <p className="text-muted">
                {cart.items.length} item{cart.items.length === 1 ? "" : "s"}
              </p>
              <ul className="space-y-2 max-h-40 overflow-y-auto">
                {cart.items.map((it) => (
                  <li
                    key={it.id}
                    className="flex justify-between text-foreground/90"
                  >
                    <span className="truncate pr-2">
                      {it.titleSnapshot}{" "}
                      <span className="text-muted">× {it.quantity}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="pt-3 border-t border-card-border space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="text-foreground">
                    {formatPrice(cart.subtotal)}
                  </dd>
                </div>
                {Number(cart.discountAmount) > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Discount</dt>
                    <dd className="text-emerald-600 dark:text-emerald-400">
                      −{formatPrice(cart.discountAmount)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted">Tax</dt>
                  <dd className="text-foreground">
                    {formatPrice(cart.taxAmount)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Shipping</dt>
                  <dd className="text-foreground">
                    {selectedQuote
                      ? selectedQuote.cost === 0
                        ? "Free"
                        : formatPrice(selectedQuote.cost)
                      : step >= 2
                      ? "—"
                      : "Calculated next"}
                  </dd>
                </div>
                <div className="flex justify-between text-base pt-3 border-t border-card-border">
                  <dt className="font-semibold text-foreground">Total</dt>
                  <dd className="font-bold text-foreground">
                    {formatPrice(
                      step >= 2 && selectedQuote
                        ? totalWithShipping
                        : cart.grandTotal,
                    )}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
