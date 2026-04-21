"use client";

import { usePathname } from "next/navigation";
import { AdminShell } from "./AdminShell";
import { StorefrontShell } from "./StorefrontShell";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <AdminShell>{children}</AdminShell>;
  }

  return <StorefrontShell>{children}</StorefrontShell>;
}
