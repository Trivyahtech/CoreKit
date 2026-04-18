"use client";

import { useAuth } from "@/modules/core/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
        router.push("/");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  return <>{children}</>;
}
