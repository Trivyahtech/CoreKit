"use client";

import { QueryProvider } from "@/platform/query/QueryProvider";
import { AuthProvider } from "@/modules/core/auth/AuthContext";
import { ThemeProvider } from "@/platform/theme/ThemeContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
