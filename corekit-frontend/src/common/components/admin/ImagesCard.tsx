"use client";

import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { api, ApiError } from "@/platform/api/client";
import { Button } from "@/common/components/ui/Button";
import { Card, CardHeader } from "@/common/components/ui/Card";
import { useToast } from "@/common/components/ui/Toast";
import { useConfirm } from "@/common/components/ui/ConfirmDialog";

type ProductImage = {
  id: string;
  url: string;
  altText?: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

export function ImagesCard({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: images, isLoading } = useQuery<ProductImage[]>({
    queryKey: ["admin-product-images", productId],
    queryFn: () => api.get(`/products/${productId}/images`),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-product-images", productId] });
    qc.invalidateQueries({ queryKey: ["admin-product", productId] });
    qc.invalidateQueries({ queryKey: ["product", productId] });
  };

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const base = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
      const res = await fetch(`${base}/products/${productId}/images`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new ApiError(res.status, err);
      }
      return res.json();
    },
    onSuccess: () => {
      refresh();
      toast({ variant: "success", title: "Image uploaded" });
    },
    onError: (err) =>
      toast({
        variant: "error",
        title: "Upload failed",
        description: err instanceof ApiError ? err.message : "Try again.",
      }),
  });

  const setPrimary = useMutation({
    mutationFn: (imageId: string) =>
      api.patch(`/products/${productId}/images/${imageId}/primary`, {}),
    onSuccess: () => {
      refresh();
      toast({ variant: "success", title: "Primary image updated" });
    },
  });

  const del = useMutation({
    mutationFn: (imageId: string) =>
      api.delete(`/products/${productId}/images/${imageId}`),
    onSuccess: () => {
      refresh();
      toast({ variant: "success", title: "Image removed" });
    },
  });

  const onDelete = async (img: ProductImage) => {
    const ok = await confirm({
      title: "Delete this image?",
      description: "This cannot be undone.",
      tone: "danger",
      confirmLabel: "Delete",
    });
    if (ok) del.mutate(img.id);
  };

  const pick = () => inputRef.current?.click();

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    for (const f of Array.from(files)) {
      upload.mutate(f);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Images</h2>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<ImagePlus className="h-4 w-4" />}
          loading={upload.isPending}
          onClick={pick}
        >
          Add images
        </Button>
        <input
          type="file"
          ref={inputRef}
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </CardHeader>
      <div className="p-5">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-card-border/40 animate-pulse"
              />
            ))}
          </div>
        ) : !images || images.length === 0 ? (
          <button
            type="button"
            onClick={pick}
            className="w-full aspect-[4/2] rounded-xl border-2 border-dashed border-card-border flex items-center justify-center text-muted hover:border-accent/50 hover:text-foreground"
          >
            <ImagePlus className="h-6 w-6 mr-2" />
            Drop or click to upload
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.altText || ""}
                  className="aspect-square w-full rounded-lg object-cover border border-card-border"
                />
                {img.isPrimary && (
                  <span className="absolute top-1.5 left-1.5 text-[10px] font-bold bg-accent text-white px-1.5 py-0.5 rounded">
                    Primary
                  </span>
                )}
                <div className="absolute inset-0 rounded-lg bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!img.isPrimary && (
                    <button
                      onClick={() => setPrimary.mutate(img.id)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md bg-white/90 text-slate-900 hover:bg-white"
                      aria-label="Set as primary"
                      title="Set as primary"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(img)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md bg-danger/90 text-white hover:bg-danger"
                    aria-label="Delete image"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
