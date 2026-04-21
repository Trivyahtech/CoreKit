"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, ShoppingBag, ShoppingCart } from "lucide-react";
import { api, ApiError, TENANT_SLUG } from "@/platform/api/client";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { Button } from "@/common/components/ui/Button";
import { Badge } from "@/common/components/ui/Badge";
import { Price } from "@/common/components/ui/Price";
import { QuantityStepper } from "@/common/components/ui/QuantityStepper";
import { PageLoader, ErrorState } from "@/common/components/ui/States";
import { WishlistButton } from "@/common/components/shop/WishlistButton";
import { ReviewsSection } from "@/common/components/shop/ReviewsSection";
import { Stars, averageRating } from "@/common/components/ui/Stars";
import { useToast } from "@/common/components/ui/Toast";
import { useRecentlyViewed } from "@/modules/storefront/recently-viewed/useRecentlyViewed";
import { cn } from "@/common/utils/cn";
import { useEffect } from "react";

type Variant = {
  id: string;
  title: string;
  price: string;
  compareAtPrice?: string | null;
  stockOnHand: number;
};

type Review = {
  id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user?: { firstName?: string; lastName?: string } | null;
};

type ProductImage = {
  id: string;
  url: string;
  altText?: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

type Product = {
  id: string;
  name: string;
  description?: string | null;
  variants: Variant[];
  categories?: { category: { slug: string; name: string } }[];
  reviews?: Review[];
  images?: ProductImage[];
};

export default function ProductDetailClient({ productId }: { productId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { track } = useRecentlyViewed();

  useEffect(() => {
    if (productId) track(productId);
  }, [productId, track]);

  const [variantId, setVariantId] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageIdx, setImageIdx] = useState(0);

  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useQuery<Product>({
    queryKey: ["product", productId],
    queryFn: () => api.get(`/products/${productId}?tenant=${TENANT_SLUG}`),
    enabled: !!productId,
  });

  const variant = useMemo(() => {
    if (!product) return null;
    return (
      product.variants.find((v) => v.id === variantId) || product.variants[0]
    );
  }, [product, variantId]);

  const addToCart = useMutation({
    mutationFn: () =>
      api.post("/cart/items", {
        productId,
        variantId: variant!.id,
        quantity: qty,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      setSuccess(true);
      setError(null);
      toast({ variant: "success", title: "Added to cart" });
      setTimeout(() => setSuccess(false), 2500);
    },
    onError: (err) => {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to add to cart. Try again.",
      );
    },
  });

  const handleAddToCart = () => {
    if (!user) {
      router.push(`/login?next=/products/${productId}`);
      return;
    }
    if (!variant) return;
    addToCart.mutate();
  };

  if (isLoading) return <PageLoader />;
  if (isError || !product)
    return (
      <ErrorState
        title="Product not found"
        description="This product may be unavailable."
        onRetry={() => refetch()}
      />
    );

  const oos = !variant || variant.stockOnHand === 0;
  const lowStock = variant && variant.stockOnHand > 0 && variant.stockOnHand < 10;
  const cat = product.categories?.[0]?.category;

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-muted">
          <li>
            <Link href="/" className="hover:text-foreground">Home</Link>
          </li>
          <li aria-hidden>/</li>
          {cat && (
            <>
              <li>
                <Link
                  href={`/products?category=${cat.slug}`}
                  className="hover:text-foreground"
                >
                  {cat.name}
                </Link>
              </li>
              <li aria-hidden>/</li>
            </>
          )}
          <li className="text-foreground font-medium line-clamp-1">
            {product.name}
          </li>
        </ol>
      </nav>

      <Link
        href="/products"
        className="inline-flex items-center text-sm font-medium text-muted hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to products
      </Link>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          {(() => {
            const images = product.images || [];
            const sorted = [...images].sort((a, b) => {
              if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
              return a.sortOrder - b.sortOrder;
            });
            const current = sorted[imageIdx] || sorted[0];
            return (
              <>
                <div className="relative aspect-square w-full rounded-2xl border border-card-border bg-card-bg flex items-center justify-center overflow-hidden">
                  {current ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={current.url}
                      alt={current.altText || product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="h-32 w-32 text-muted/20" aria-hidden />
                  )}
                  <WishlistButton
                    productId={productId}
                    className="absolute top-4 right-4"
                  />
                </div>
                {sorted.length > 1 && (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {sorted.slice(0, 5).map((img, i) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setImageIdx(i)}
                        className={cn(
                          "aspect-square rounded-lg border overflow-hidden transition-colors",
                          i === imageIdx
                            ? "border-accent ring-2 ring-accent/30"
                            : "border-card-border hover:border-accent/40",
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.altText || `${product.name} image ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {product.name}
          </h1>

          {product.reviews && product.reviews.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <Stars value={Math.round(averageRating(product.reviews))} />
              <span className="text-sm text-muted">
                {averageRating(product.reviews).toFixed(1)} ({product.reviews.length})
              </span>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <Price
              value={variant?.price}
              compareAt={variant?.compareAtPrice}
              size="xl"
            />
            {oos ? (
              <Badge tone="danger">Out of stock</Badge>
            ) : lowStock ? (
              <Badge tone="warning">Only {variant.stockOnHand} left</Badge>
            ) : (
              <Badge tone="success">In stock</Badge>
            )}
          </div>

          {product.description && (
            <div className="mt-6 text-base text-foreground/80 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          )}

          {product.variants.length > 1 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Variant
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const selected =
                    (variantId && variantId === v.id) ||
                    (!variantId && product.variants[0].id === v.id);
                  const variantOos = v.stockOnHand === 0;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setVariantId(v.id)}
                      disabled={variantOos}
                      className={cn(
                        "h-10 px-4 rounded-lg text-sm font-semibold border transition-colors",
                        selected
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-card-border bg-card-bg text-foreground hover:border-accent/50",
                        variantOos &&
                          "opacity-50 line-through cursor-not-allowed",
                      )}
                    >
                      {v.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <span className="text-sm font-semibold text-foreground">
              Quantity
            </span>
            <QuantityStepper
              value={qty}
              onChange={setQty}
              min={1}
              max={variant?.stockOnHand || 99}
              disabled={oos}
            />
          </div>

          {error && (
            <p className="mt-4 text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleAddToCart}
              size="lg"
              fullWidth
              disabled={oos}
              loading={addToCart.isPending}
              leftIcon={
                success ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <ShoppingCart className="h-5 w-5" />
                )
              }
              className={cn(
                success && "bg-emerald-600 hover:bg-emerald-600",
              )}
            >
              {oos
                ? "Out of stock"
                : success
                ? "Added to cart"
                : "Add to cart"}
            </Button>
          </div>
        </div>
      </div>

      <ReviewsSection productId={productId} reviews={product.reviews || []} />
    </div>
  );
}
