"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MessageCircle, Pencil } from "lucide-react";
import { api, ApiError, TENANT_SLUG } from "@/platform/api/client";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { Stars, averageRating } from "@/common/components/ui/Stars";
import { Button } from "@/common/components/ui/Button";
import { Badge } from "@/common/components/ui/Badge";
import { Modal } from "@/common/components/ui/Modal";
import { Input } from "@/common/components/ui/Input";
import { Textarea } from "@/common/components/ui/FormControls";
import { EmptyState } from "@/common/components/ui/States";
import { useToast } from "@/common/components/ui/Toast";

type Review = {
  id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user?: { firstName?: string; lastName?: string } | null;
};

function ReviewCard({ r }: { r: Review }) {
  const name = r.user?.firstName
    ? `${r.user.firstName}${r.user.lastName ? " " + r.user.lastName[0] + "." : ""}`
    : "Anonymous";
  return (
    <article className="rounded-2xl border border-card-border bg-card-bg p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Stars value={r.rating} />
            <span className="text-sm font-medium text-foreground">{name}</span>
            {r.isVerifiedPurchase && (
              <Badge tone="success" size="sm">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          {r.title && (
            <h4 className="mt-2 font-semibold text-foreground">{r.title}</h4>
          )}
          {r.body && (
            <p className="mt-1 text-sm text-foreground/90 whitespace-pre-line">
              {r.body}
            </p>
          )}
        </div>
        <time
          className="text-xs text-muted whitespace-nowrap"
          dateTime={r.createdAt}
        >
          {new Date(r.createdAt).toLocaleDateString()}
        </time>
      </div>
    </article>
  );
}

export function ReviewsSection({
  productId,
  reviews: initialReviews,
}: {
  productId: string;
  reviews: Review[];
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const { data: fetched } = useQuery<Review[]>({
    queryKey: ["reviews", productId],
    queryFn: () =>
      api.get(`/reviews?productId=${productId}&tenant=${TENANT_SLUG}`),
    initialData: initialReviews,
  });

  const reviews = fetched ?? initialReviews;
  const avg = useMemo(() => averageRating(reviews), [reviews]);

  const submit = useMutation({
    mutationFn: () =>
      api.post("/reviews", { productId, rating, title, body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product", productId] });
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
      toast({
        variant: "success",
        title: "Review submitted",
        description: "Thanks! Your review is pending moderation.",
      });
      setOpen(false);
      setTitle("");
      setBody("");
      setRating(5);
    },
    onError: (err) => {
      toast({
        variant: "error",
        title: "Couldn't submit review",
        description:
          err instanceof ApiError
            ? err.message
            : "Reviews aren't available right now.",
      });
    },
  });

  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Customer reviews
          </h2>
          {reviews.length > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <Stars value={Math.round(avg)} />
              <span className="text-sm text-muted">
                {avg.toFixed(1)} out of 5 · {reviews.length} review
                {reviews.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>
        {user && (
          <Button
            variant="outline"
            leftIcon={<Pencil className="h-4 w-4" />}
            onClick={() => setOpen(true)}
          >
            Write a review
          </Button>
        )}
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No reviews yet"
          description="Be the first to share your thoughts on this product."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {reviews.map((r) => (
            <ReviewCard key={r.id} r={r} />
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Write a review"
        description="Share your experience with other shoppers."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={submit.isPending}
              onClick={() => submit.mutate()}
              disabled={rating < 1}
            >
              Submit review
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Your rating
            </label>
            <Stars
              value={rating}
              onChange={setRating}
              size="lg"
              ariaLabel="Select rating"
            />
          </div>
          <Input
            label="Title"
            placeholder="Best purchase this year!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />
          <Textarea
            label="Your review"
            placeholder="What did you like (or not like) about this product?"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
          />
        </form>
      </Modal>
    </section>
  );
}
