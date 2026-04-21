"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, MapPin, UserCircle } from "lucide-react";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { PageLoader } from "@/common/components/ui/States";
import { cn } from "@/common/utils/cn";

const TABS = [
  { href: "/account", label: "Profile", icon: UserCircle, exact: true },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?next=/account");
  }, [isLoading, user, router]);

  if (isLoading || !user) return <PageLoader />;

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/" className="hover:text-foreground inline-flex items-center gap-1">
          <Home className="h-3.5 w-3.5" /> Home
        </Link>
        <span className="px-1.5 opacity-60">/</span>
        <span className="text-foreground font-medium">My account</span>
      </nav>

      <div className="pb-4 border-b border-card-border">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          My account
        </h1>
        <p className="mt-1 text-sm text-muted">
          {user.firstName} {user.lastName} · {user.email}
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start mt-6">
        <aside className="lg:col-span-3">
          <nav className="flex lg:flex-col gap-1">
            {TABS.map((t) => {
              const active = t.exact
                ? pathname === t.href
                : pathname.startsWith(t.href);
              const Icon = t.icon;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-accent/10 text-accent"
                      : "text-foreground/80 hover:bg-card-border/30",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}
