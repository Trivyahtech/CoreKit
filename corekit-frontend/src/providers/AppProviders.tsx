"use client";

import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/contexts/AuthContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
