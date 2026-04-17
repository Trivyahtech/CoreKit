"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/platform/api/client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ShoppingBag, ArrowLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/modules/core/auth/AuthContext";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const productId = params.id as string;

  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [success, setSuccess] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => api.get(`/products/${productId}`),
  });

  const addToCartMutation = useMutation({
    mutationFn: (data: { productId: string; variantId: string; quantity: number }) =>
      api.post("/cart/items", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const handleAddToCart = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    
    // Default to first variant if not selected
    const vId = selectedVariantId || product?.variants[0]?.id;
    if (!vId) return;

    addToCartMutation.mutate({
      productId,
      variantId: vId,
      quantity,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-32">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <Link href="/products" className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-500">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
        </Link>
      </div>
    );
  }

  const selectedVariant = product.variants.find((v: any) => v.id === selectedVariantId) || product.variants[0];

  return (
    <div className="pt-6 pb-16">
      <Link href="/products" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Products
      </Link>

      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12">
        {/* Product Image Placeholder */}
        <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center lg:h-[600px]">
          <ShoppingBag className="h-32 w-32 text-gray-300 opacity-20" />
        </div>

        {/* Product Info */}
        <div className="mt-10 px-4 sm:px-0 lg:mt-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            {product.name}
          </h1>
          <div className="mt-4 flex items-center">
            <p className="text-3xl font-bold text-gray-900">
              ₹{selectedVariant?.price}
            </p>
            {selectedVariant?.stockOnHand < 10 && (
              <p className="ml-4 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                Only {selectedVariant.stockOnHand} left in stock
              </p>
            )}
          </div>

          <div className="mt-6">
            <h3 className="sr-only">Description</h3>
            <div className="space-y-6 text-base text-gray-700 leading-relaxed">
              {product.description || "Beautifully crafted product designed with premium materials. Ensure maximum performance and longevity."}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            {/* Variants Selector */}
            {product.variants.length > 1 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Select Variant</h3>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant: any) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                        (selectedVariantId === variant.id) || (!selectedVariantId && product.variants[0].id === variant.id)
                          ? "border-indigo-600 text-indigo-700 bg-indigo-50 ring-1 ring-indigo-600"
                          : "border-gray-300 text-gray-700 hover:border-gray-400 bg-white"
                      }`}
                    >
                      {variant.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-8 flex items-center gap-4">
              <h3 className="text-sm font-medium text-gray-900">Quantity</h3>
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-2 text-gray-900 font-medium min-w-[3rem] text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(selectedVariant?.stockOnHand || 99, quantity + 1))}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending || selectedVariant?.stockOnHand === 0}
              className={`w-full flex-1 flex items-center justify-center p-4 rounded-xl text-base font-bold shadow-sm transition-all ${
                success
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : selectedVariant?.stockOnHand === 0
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md"
              }`}
            >
              {addToCartMutation.isPending ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : success ? (
                <>
                  <Check className="h-5 w-5 mr-2" /> Added to Cart
                </>
              ) : selectedVariant?.stockOnHand === 0 ? (
                "Out of Stock"
              ) : (
                "Add to Cart"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
