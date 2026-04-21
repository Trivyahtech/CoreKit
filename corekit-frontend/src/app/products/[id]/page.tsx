import type { Metadata } from "next";
import { BRAND } from "@/common/config/brand";
import { TENANT_SLUG } from "@/platform/api/client";
import ProductDetailClient from "./product-detail-client";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL_SERVER ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:6767/api/v1";

type ProductMetaShape = {
  success?: boolean;
  data?: {
    name: string;
    shortDescription?: string | null;
    description?: string | null;
    images?: Array<{ url: string; isPrimary: boolean }>;
  };
};

async function fetchProduct(id: string): Promise<ProductMetaShape["data"] | null> {
  try {
    const res = await fetch(
      `${API_BASE}/products/${encodeURIComponent(id)}?tenant=${TENANT_SLUG}`,
      { next: { revalidate: 120 } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as ProductMetaShape;
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const product = await fetchProduct(id);
  if (!product) {
    return {
      title: `Product · ${BRAND.name}`,
    };
  }
  const description =
    product.shortDescription ||
    (product.description ? product.description.slice(0, 160) : BRAND.description);
  const primary = product.images?.find((i) => i.isPrimary) ?? product.images?.[0];
  return {
    title: `${product.name} · ${BRAND.name}`,
    description,
    openGraph: {
      title: `${product.name} · ${BRAND.name}`,
      description: description || undefined,
      images: primary ? [{ url: primary.url }] : undefined,
      type: "website",
    },
    twitter: {
      card: primary ? "summary_large_image" : "summary",
      title: product.name,
      description: description || undefined,
      images: primary ? [primary.url] : undefined,
    },
  };
}

export default async function ProductDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <ProductDetailClient productId={id} />;
}
