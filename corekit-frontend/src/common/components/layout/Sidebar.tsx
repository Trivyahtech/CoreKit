"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { useTheme } from "@/platform/theme/ThemeContext";
import {
  Home,
  ShoppingBag,
  Grid3x3,
  ShoppingCart,
  Package,
  LayoutDashboard,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Settings,
} from "lucide-react";

const storefrontMenu = [
  { name: "Home", href: "/", icon: Home },
  { name: "Products", href: "/products", icon: ShoppingBag },
  { name: "Categories", href: "/categories", icon: Grid3x3 },
  { name: "Cart", href: "/cart", icon: ShoppingCart },
  { name: "Orders", href: "/orders", icon: Package },
];

const adminMenu = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { sidebarCollapsed, toggleSidebar, sidebarOpen, setSidebarOpen } = useTheme();

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-hover flex-shrink-0">
        {!sidebarCollapsed && (
          <Link href="/" className="flex items-center" onClick={() => setSidebarOpen(false)}>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              CoreKit
            </span>
          </Link>
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-sidebar-text hover:text-white hover:bg-sidebar-hover transition-colors"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-sidebar-text hover:text-white hover:bg-sidebar-hover transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 sidebar-scroll overflow-y-auto">
        {/* Storefront Section */}
        {!sidebarCollapsed && (
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-text/60 mb-2">
            Store
          </p>
        )}
        {storefrontMenu.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? item.name : undefined}
              className={`flex items-center ${sidebarCollapsed ? "justify-center" : ""} px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 group ${
                active
                  ? "bg-accent text-white shadow-md shadow-accent/25"
                  : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${active ? "" : "group-hover:scale-110 transition-transform"}`} />
              {!sidebarCollapsed && <span className="ml-3 truncate">{item.name}</span>}
            </Link>
          );
        })}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-1">
              {!sidebarCollapsed && (
                <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-text/60">
                  Admin
                </p>
              )}
              {sidebarCollapsed && <div className="border-t border-sidebar-hover mx-2" />}
            </div>
            {adminMenu.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={`flex items-center ${sidebarCollapsed ? "justify-center" : ""} px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 group ${
                    active
                      ? "bg-accent text-white shadow-md shadow-accent/25"
                      : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                  }`}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${active ? "" : "group-hover:scale-110 transition-transform"}`} />
                  {!sidebarCollapsed && <span className="ml-3 truncate">{item.name}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User Info Footer */}
      {user && (
        <div className="px-3 py-4 border-t border-sidebar-hover flex-shrink-0">
          <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : ""}`}>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg">
              {user.firstName[0]}
            </div>
            {!sidebarCollapsed && (
              <div className="ml-3 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-sidebar-text truncate">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-sidebar-bg flex flex-col z-50
          sidebar-transition
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarCollapsed ? "w-[68px]" : "w-64"}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
