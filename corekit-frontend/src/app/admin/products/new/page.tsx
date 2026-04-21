"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { api, ApiError, TENANT_SLUG } from "@/platform/api/client";
import { AdminPageHeader } from "@/common/components/layout/AdminPageHeader";
import { Button } from "@/common/components/ui/Button";
import { Card, CardBody } from "@/common/components/ui/Card";
import { Input } from "@/common/components/ui/Input";
import { Textarea } from "@/common/components/ui/FormControls";
import { useToast } from "@/common/components/ui/Toast";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    tenantSlug: TENANT_SLUG,
    name: "",
    slug: "",
    shortDescription: "",
    description: "",
    brand: "",
    taxRate: "18",
  });
  const [slugTouched, setSlugTouched] = useState(false);

  const create = useMutation({
    mutationFn: () =>
      api.post("/products", {
        ...form,
        taxRate: Number(form.taxRate) || 0,
      }),
    onSuccess: (p: { id: string }) => {
      toast({
        variant: "success",
        title: "Product created",
        description: "You can now add variants and publish it.",
      });
      router.push(`/admin/products/${p.id}`);
    },
    onError: (err) => {
      toast({
        variant: "error",
        title: "Couldn't create product",
        description:
          err instanceof ApiError ? err.message : "Check the fields and retry.",
      });
    },
  });

  return (
    <div>
      <AdminPageHeader
        title="New product"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          { label: "New" },
        ]}
        actions={
          <Link
            href="/admin/products"
            className="inline-flex h-10 px-3 items-center gap-1.5 rounded-lg border border-card-border bg-card-bg text-sm font-semibold hover:bg-card-border/30"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="grid lg:grid-cols-3 gap-6 items-start"
      >
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardBody className="space-y-4">
              <Input
                label="Product name"
                required
                autoFocus
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: slugTouched ? f.slug : slugify(name),
                  }));
                }}
              />
              <Input
                label="Slug"
                required
                hint="URL-friendly identifier, unique within the tenant"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm({ ...form, slug: slugify(e.target.value) });
                }}
              />
              <Input
                label="Short description"
                value={form.shortDescription}
                onChange={(e) =>
                  setForm({ ...form, shortDescription: e.target.value })
                }
                maxLength={200}
                hint="One-liner shown on listings"
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
        </div>

        <aside className="space-y-6">
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
                onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
              />
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-3">
              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={create.isPending}
              >
                Create product
              </Button>
              <p className="text-xs text-muted text-center">
                Starts in DRAFT. Add variants &amp; publish next.
              </p>
            </CardBody>
          </Card>
        </aside>
      </form>
    </div>
  );
}
