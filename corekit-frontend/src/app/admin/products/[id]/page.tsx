"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Package,
  Save,
  Trash2,
} from "lucide-react";
import { api, ApiError, TENANT_SLUG } from "@/platform/api/client";
import { useRole } from "@/modules/core/rbac";
import { AdminPageHeader } from "@/common/components/layout/AdminPageHeader";
import { Button } from "@/common/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/common/components/ui/Card";
import { Input } from "@/common/components/ui/Input";
import { Textarea } from "@/common/components/ui/FormControls";
import { Badge } from "@/common/components/ui/Badge";
import { Checkbox } from "@/common/components/ui/FormControls";
import { PageLoader, ErrorState } from "@/common/components/ui/States";
import { formatPrice } from "@/common/components/ui/Price";
import { useToast } from "@/common/components/ui/Toast";
import { useConfirm } from "@/common/components/ui/ConfirmDialog";
import { VariantsCard } from "@/common/components/admin/VariantsCard";
import { ImagesCard } from "@/common/components/admin/ImagesCard";

type Variant = {
  id: string;
  sku: string;
  title: string;
  price: string;
  stockOnHand: number;
};

type Category = { id: string; name: string };

type Product = {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  brand?: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isPublished: boolean;
  taxRate?: string | null;
  variants: Variant[];
  categories?: { category: Category }[];
};

export default function AdminProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();
  const { canDeleteProducts } = useRole();
  const productId = params.id as string;

  const [form, setForm] = useState({
    name: "",
    slug: "",
    shortDescription: "",
    description: "",
    brand: "",
    taxRate: "18",
  });
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useQuery<Product>({
    queryKey: ["admin-product", productId],
    queryFn: () => api.get(`/products/${productId}?tenant=${TENANT_SLUG}`),
    enabled: !!productId,
  });

  const { data: allCategories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get(`/categories?tenant=${TENANT_SLUG}`),
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription || "",
        description: product.description || "",
        brand: product.brand || "",
        taxRate: product.taxRate ? String(product.taxRate) : "18",
      });
      setSelectedCats(
        product.categories?.map((pc) => pc.category.id) || [],
      );
    }
  }, [product]);

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/products/${productId}`, {
        ...form,
        taxRate: Number(form.taxRate) || 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-product", productId] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ variant: "success", title: "Product saved" });
    },
    onError: (err) => {
      toast({
        variant: "error",
        title: "Couldn't save",
        description:
          err instanceof ApiError ? err.message : "Check fields and retry.",
      });
    },
  });

  const publish = useMutation({
    mutationFn: (v: boolean) =>
      api.patch(
        v ? `/products/${productId}/publish` : `/products/${productId}/unpublish`,
        {},
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-product", productId] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ variant: "success", title: "Publish status updated" });
    },
  });

  const updateCategories = useMutation({
    mutationFn: () =>
      api.patch(`/products/${productId}/categories`, {
        categoryIds: selectedCats,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-product", productId] });
      toast({ variant: "success", title: "Categories updated" });
    },
    onError: (err) => {
      toast({
        variant: "error",
        title: "Couldn't update categories",
        description: err instanceof ApiError ? err.message : undefined,
      });
    },
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/products/${productId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ variant: "success", title: "Product deleted" });
      router.push("/admin/products");
    },
    onError: (err) => {
      toast({
        variant: "error",
        title: "Couldn't delete",
        description: err instanceof ApiError ? err.message : undefined,
      });
    },
  });

  const onDelete = async () => {
    const ok = await confirm({
      title: "Delete this product?",
      description: "This action cannot be undone.",
      tone: "danger",
      confirmLabel: "Delete",
    });
    if (ok) remove.mutate();
  };

  if (isLoading) return <PageLoader />;
  if (isError || !product)
    return (
      <ErrorState
        title="Product not found"
        onRetry={() => refetch()}
      />
    );

  return (
    <div>
      <AdminPageHeader
        title={product.name}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          { label: product.name },
        ]}
        actions={
          <>
            <Link
              href="/admin/products"
              className="inline-flex h-10 px-3 items-center gap-1.5 rounded-lg border border-card-border bg-card-bg text-sm font-semibold hover:bg-card-border/30"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            {canDeleteProducts && (
              <Button
                variant="outline"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={onDelete}
                loading={remove.isPending}
                className="border-danger/40 text-danger hover:bg-danger/10"
              >
                Delete
              </Button>
            )}
          </>
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="grid lg:grid-cols-3 gap-6 items-start"
      >
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Details
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Slug"
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
              <Input
                label="Short description"
                value={form.shortDescription}
                onChange={(e) =>
                  setForm({ ...form, shortDescription: e.target.value })
                }
                maxLength={200}
              />
              <Textarea
                label="Full description"
                rows={8}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </CardBody>
          </Card>

          <VariantsCard
            productId={productId}
            variants={product.variants as any}
            invalidateKey={["admin-product", productId]}
          />

          <ImagesCard productId={productId} />
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Status
              </h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Current</span>
                <Badge
                  tone={
                    product.status === "ACTIVE"
                      ? "success"
                      : product.status === "ARCHIVED"
                      ? "neutral"
                      : "warning"
                  }
                >
                  {product.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Visibility</span>
                <span
                  className={
                    product.isPublished
                      ? "text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                      : "text-xs font-semibold text-muted"
                  }
                >
                  {product.isPublished ? "Published" : "Unpublished"}
                </span>
              </div>
              {product.isPublished ? (
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  leftIcon={<EyeOff className="h-4 w-4" />}
                  loading={publish.isPending}
                  onClick={() => publish.mutate(false)}
                >
                  Unpublish
                </Button>
              ) : (
                <Button
                  type="button"
                  fullWidth
                  leftIcon={<Eye className="h-4 w-4" />}
                  loading={publish.isPending}
                  onClick={() => publish.mutate(true)}
                >
                  Publish
                </Button>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Categories
              </h2>
            </CardHeader>
            <CardBody className="space-y-2 max-h-64 overflow-y-auto">
              {(allCategories || []).length === 0 ? (
                <p className="text-sm text-muted">No categories yet.</p>
              ) : (
                allCategories!.map((c) => (
                  <Checkbox
                    key={c.id}
                    label={c.name}
                    checked={selectedCats.includes(c.id)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selectedCats, c.id]
                        : selectedCats.filter((id) => id !== c.id);
                      setSelectedCats(next);
                    }}
                  />
                ))
              )}
            </CardBody>
            <div className="px-5 pb-5">
              <Button
                type="button"
                variant="outline"
                fullWidth
                loading={updateCategories.isPending}
                onClick={() => updateCategories.mutate()}
              >
                Save categories
              </Button>
            </div>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <Input
                label="Brand"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
              <Input
                label="Tax rate (%)"
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={form.taxRate}
                onChange={(e) =>
                  setForm({ ...form, taxRate: e.target.value })
                }
              />
              <Button
                type="submit"
                fullWidth
                size="lg"
                leftIcon={<Save className="h-4 w-4" />}
                loading={save.isPending}
              >
                Save changes
              </Button>
            </CardBody>
          </Card>

          <p className="text-xs text-muted flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Product ID: <code className="font-mono">{product.id}</code>
          </p>
        </aside>
      </form>
    </div>
  );
}
