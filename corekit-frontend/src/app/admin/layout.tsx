"use client";

import { RoleGuard } from "@/common/components/auth/RoleGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard allow={["ADMIN", "STAFF", "SUPERADMIN"]}>{children}</RoleGuard>;
}
