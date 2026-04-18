"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/common/components/layout/Sidebar";
import { Topbar } from "@/common/components/layout/Topbar";
import { useTheme } from "@/platform/theme/ThemeContext";

const AUTH_ROUTES = ["/login", "/register"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sidebarCollapsed } = useTheme();

  const isAuthPage = AUTH_ROUTES.includes(pathname);

  // Auth pages render without shell
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${
          sidebarCollapsed ? "lg:ml-0" : "lg:ml-0"
        }`}
      >
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
