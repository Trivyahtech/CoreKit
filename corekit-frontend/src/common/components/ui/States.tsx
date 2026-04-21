"use client";

import { cn } from "@/common/utils/cn";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "./Button";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("h-5 w-5 animate-spin text-accent", className)}
      aria-label="Loading"
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border border-dashed border-card-border rounded-2xl bg-card-bg/50 px-6 py-16 text-center",
        className,
      )}
    >
      {Icon && (
        <Icon className="mx-auto mb-4 h-12 w-12 text-muted/40" aria-hidden />
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Please try again.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border border-dashed border-danger/40 rounded-2xl bg-danger/5 px-6 py-12 text-center",
        className,
      )}
      role="alert"
    >
      <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-danger" aria-hidden />
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted max-w-md mx-auto">{description}</p>
      {onRetry && (
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
