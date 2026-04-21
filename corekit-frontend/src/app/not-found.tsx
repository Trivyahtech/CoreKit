import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="mx-auto h-20 w-20 rounded-full bg-accent/10 text-accent flex items-center justify-center">
        <Compass className="h-10 w-10" />
      </div>
      <p className="mt-6 text-xs uppercase tracking-widest font-bold text-accent">
        Error 404
      </p>
      <h1 className="mt-2 text-3xl font-extrabold text-foreground">
        Page not found
      </h1>
      <p className="mt-2 text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 px-6 items-center rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent/90"
        >
          Back home
        </Link>
        <Link
          href="/products"
          className="inline-flex h-11 px-6 items-center rounded-full border border-card-border bg-card-bg text-sm font-semibold text-foreground hover:bg-card-border/30"
        >
          Browse products
        </Link>
      </div>
    </div>
  );
}
