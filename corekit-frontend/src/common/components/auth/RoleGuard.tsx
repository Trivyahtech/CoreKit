"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { hasRole, type Role } from "@/modules/core/rbac";
import { PageLoader } from "@/common/components/ui/States";

type Props = {
  allow: Role[];
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
};

export function RoleGuard({ allow, children, redirectTo = "/", fallback }: Props) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!hasRole(user.role, allow)) {
      router.replace(redirectTo);
    }
  }, [isLoading, user, allow, redirectTo, router]);

  if (isLoading || !user) return fallback ?? <PageLoader />;
  if (!hasRole(user.role, allow)) return fallback ?? <PageLoader />;

  return <>{children}</>;
}
