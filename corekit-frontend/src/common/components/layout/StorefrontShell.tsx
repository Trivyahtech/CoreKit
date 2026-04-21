"use client";

import { StorefrontNavbar } from "./StorefrontNavbar";
import { StorefrontFooter } from "./StorefrontFooter";
import { PromoBanner } from "./PromoBanner";

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PromoBanner />
      <StorefrontNavbar />
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>
      <StorefrontFooter />
    </div>
  );
}
