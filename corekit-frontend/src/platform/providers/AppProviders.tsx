"use client";

import { QueryProvider } from "@/platform/query/QueryProvider";
import { AuthProvider } from "@/modules/core/auth/AuthContext";
import { ThemeProvider } from "@/platform/theme/ThemeContext";
import { ToastProvider } from "@/common/components/ui/Toast";
import { ConfirmDialogProvider } from "@/common/components/ui/ConfirmDialog";
import { WishlistProvider } from "@/modules/storefront/wishlist/WishlistContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <ConfirmDialogProvider>
              <WishlistProvider>{children}</WishlistProvider>
            </ConfirmDialogProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
