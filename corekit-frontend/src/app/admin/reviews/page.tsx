"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MessageSquare, ShieldCheck, Trash2, X } from "lucide-react";
import { api, ApiError } from "@/platform/api/client";
import { AdminPageHeader } from "@/common/components/layout/AdminPageHeader";
import { Badge } from "@/common/components/ui/Badge";
import { Button } from "@/common/components/ui/Button";
import { Card, CardBody } from "@/common/components/ui/Card";
import { Stars } from "@/common/components/ui/Stars";
import { Tabs, type TabItem } from "@/common/components/ui/Tabs";
import {
  EmptyState,
  ErrorState,
  PageLoader,
} from "@/common/components/ui/States";
import { useToast } from "@/common/components/ui/Toast";
import { useConfirm } from "@/common/components/ui/ConfirmDialog";

type Review = {
  id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isVerifiedPurchase: boolean;
  createdAt: string;
  user?: { firstName?: string; lastName?: string; email?: string };
  product?: { id: string; name: string; slug: string };
};

type StatusKey = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

const TABS: TabItem<StatusKey>[] = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "ALL", label: "All" },
];

export default function AdminReviewsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState<StatusKey>("PENDING");

  const { data: stats } = useQuery<Record<string, number>>({
    queryKey: ["admin-review-stats"],
    queryFn: () => api.get("/reviews/admin/stats"),
  });

  const {
    data: reviews,
    isLoading,
    isError,
    refetch,
  } = useQuery<Review[]>({
    queryKey: ["admin-reviews", tab],
    queryFn: () =>
      api.get(tab === "ALL" ? "/reviews/admin" : `/reviews/admin?status=${tab}`),
  });

  const tabItems: TabItem<StatusKey>[] = useMemo(
    () =>
      TABS.map((t) => ({
        ...t,
        badge:
          t.key === "ALL"
            ? (stats?.PENDING ?? 0) + (stats?.APPROVED ?? 0) + (stats?.REJECTED ?? 0)
            : stats?.[t.key] ?? 0,
      })),
    [stats],
  );

  const moderate = useMutation({
    mutationFn: (p: { id: string; status: "APPROVED" | "REJECTED" }) =>
      api.patch(`/reviews/${p.id}/moderate`, { status: p.status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["admin-review-stats"] });
      toast({ variant: "success", title: "Review updated" });
    },
    onError: (err) =>
      toast({
        variant: "error",
        title: "Couldn't update review",
        description: err instanceof ApiError ? err.message : undefined,
      }),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/reviews/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["admin-review-stats"] });
      toast({ variant: "success", title: "Review deleted" });
    },
  });

  const onDelete = async (r: Review) => {
    const ok = await confirm({
      title: "Delete this review?",
      description: "This cannot be undone.",
      tone: "danger",
      confirmLabel: "Delete",
    });
    if (ok) del.mutate(r.id);
  };

  return (
    <div>
      <AdminPageHeader
        title="Reviews"
        description="Approve, reject or remove customer feedback"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Reviews" },
        ]}
      />

      <Tabs items={tabItems} value={tab} onChange={setTab} className="mb-5" />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !reviews || reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews here"
          description={
            tab === "PENDING"
              ? "Nothing awaiting moderation — great job!"
              : "No reviews match this filter."
          }
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardBody className="flex flex-col sm:flex-row gap-4 sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={r.rating} />
                    {r.isVerifiedPurchase && (
                      <Badge tone="success" size="sm">
                        <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                    <Badge
                      tone={
                        r.status === "APPROVED"
                          ? "success"
                          : r.status === "REJECTED"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {r.status}
                    </Badge>
                  </div>
                  <div>
                    {r.title && (
                      <p className="font-semibold text-foreground">{r.title}</p>
                    )}
                    {r.body && (
                      <p className="text-sm text-foreground/90 whitespace-pre-line">
                        {r.body}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                    <span>
                      {r.user?.firstName} {r.user?.lastName} · {r.user?.email}
                    </span>
                    <span>·</span>
                    {r.product && (
                      <Link
                        href={`/admin/products/${r.product.id}`}
                        className="text-accent hover:underline"
                      >
                        {r.product.name}
                      </Link>
                    )}
                    <span>·</span>
                    <time dateTime={r.createdAt}>
                      {new Date(r.createdAt).toLocaleString()}
                    </time>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.status !== "APPROVED" && (
                    <Button
                      size="sm"
                      leftIcon={<Check className="h-4 w-4" />}
                      loading={moderate.isPending}
                      onClick={() =>
                        moderate.mutate({ id: r.id, status: "APPROVED" })
                      }
                    >
                      Approve
                    </Button>
                  )}
                  {r.status !== "REJECTED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<X className="h-4 w-4" />}
                      loading={moderate.isPending}
                      onClick={() =>
                        moderate.mutate({ id: r.id, status: "REJECTED" })
                      }
                    >
                      Reject
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => onDelete(r)}
                    className="border-danger/40 text-danger hover:bg-danger/10"
                  >
                    Delete
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
