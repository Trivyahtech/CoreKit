"use client";

import { Heart } from "lucide-react";
import { cn } from "@/common/utils/cn";
import { useWishlist } from "@/modules/storefront/wishlist/WishlistContext";
import { useToast } from "@/common/components/ui/Toast";

export function WishlistButton({
  productId,
  className,
  size = "md",
}: {
  productId: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const { has, toggle } = useWishlist();
  const { toast } = useToast();
  const active = has(productId);
  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggle(productId);
        toast({
          variant: "success",
          title: added ? "Added to wishlist" : "Removed from wishlist",
        });
      }}
      aria-label={active ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center justify-center rounded-full border backdrop-blur transition-colors",
        dim,
        active
          ? "bg-danger/10 border-danger/40 text-danger"
          : "bg-card-bg/80 border-card-border text-muted hover:text-danger hover:border-danger/40",
        className,
      )}
    >
      <Heart className={cn(icon, active && "fill-current")} />
    </button>
  );
}
