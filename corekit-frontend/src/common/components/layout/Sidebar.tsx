"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Database,
  FolderTree,
  Home,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Truck,
  UserCheck,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { useTheme } from "@/platform/theme/ThemeContext";
import { useRole, ROLE_LABELS, type Role } from "@/modules/core/rbac";
import { cn } from "@/common/utils/cn";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
};

const STOREFRONT: NavItem[] = [
  { name: "Home", href: "/", icon: Home },
  { name: "Shop", href: "/products", icon: ShoppingBag },
  { name: "Orders", href: "/orders", icon: Package },
];

const ADMIN_MENU: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart, roles: ["ADMIN", "STAFF", "SUPERADMIN"] },
  { name: "Customers", href: "/admin/customers", icon: UserCheck, roles: ["ADMIN", "STAFF", "SUPERADMIN"] },
  { name: "Products", href: "/admin/products", icon: Package, roles: ["ADMIN", "STAFF", "SUPERADMIN"] },
  { name: "Categories", href: "/admin/categories", icon: FolderTree, roles: ["ADMIN", "STAFF", "SUPERADMIN"] },
  { name: "Inventory", href: "/admin/inventory", icon: Warehouse, roles: ["ADMIN", "STAFF", "SUPERADMIN"] },
  { name: "Purchase orders", href: "/admin/purchase-orders", icon: ClipboardList, roles: ["ADMIN", "STAFF", "SUPERADMIN"] },
  { name: "Coupons", href: "/admin/coupons", icon: Tag, roles: ["ADMIN", "STAFF", "SUPERADMIN"] },
  { name: "Reviews", href: "/admin/reviews", icon: MessageSquare, roles: ["ADMIN", "STAFF", "SUPERADMIN"] },
  { name: "Shipping", href: "/admin/shipping", icon: Truck, roles: ["ADMIN", "SUPERADMIN"] },
  { name: "Staff & roles", href: "/admin/users", icon: Users, roles: ["ADMIN", "SUPERADMIN"] },
  { name: "Mail templates", href: "/admin/mail-templates", icon: Mail, roles: ["ADMIN", "SUPERADMIN"] },
  { name: "Data & purge", href: "/admin/data", icon: Database, roles: ["ADMIN", "SUPERADMIN"] },
  { name: "Settings", href: "/admin/settings", icon: Settings, roles: ["ADMIN", "SUPERADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { sidebarCollapsed, toggleSidebar, sidebarOpen, setSidebarOpen } =
    useTheme();
  const { role } = useRole();

  const adminItems = ADMIN_MENU.filter((m) => !m.roles || (role && m.roles.includes(role)));

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        onClick={() => setSidebarOpen(false)}
        title={sidebarCollapsed ? item.name : undefined}
        className={cn(
          "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
          sidebarCollapsed ? "justify-center" : "",
          active
            ? "bg-accent text-white shadow-md shadow-accent/25"
            : "text-sidebar-text hover:bg-sidebar-hover hover:text-white",
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!sidebarCollapsed && <span className="ml-3 truncate">{item.name}</span>}
      </Link>
    );
  };

  const content = (
    <>
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-hover shrink-0">
        {!sidebarCollapsed && (
          <Link
            href="/admin"
            className="flex items-center"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-sky-400 to-amber-400">
              Mission NCC
            </span>
            <span className="ml-2 text-[10px] uppercase tracking-widest font-bold text-sidebar-text">
              Admin
            </span>
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-text hover:text-white hover:bg-sidebar-hover"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden h-8 w-8 inline-flex items-center justify-center rounded-lg text-sidebar-text hover:text-white hover:bg-sidebar-hover"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 sidebar-scroll overflow-y-auto">
        {!sidebarCollapsed && (
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-text/60 mb-2">
            Operate
          </p>
        )}
        {adminItems.map((i) => (
          <NavLink key={i.href} item={i} />
        ))}

        <div className="pt-4 pb-1">
          {!sidebarCollapsed && (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-text/60">
              Storefront
            </p>
          )}
          {sidebarCollapsed && (
            <div className="border-t border-sidebar-hover mx-2" />
          )}
        </div>
        {STOREFRONT.map((i) => (
          <NavLink key={i.href} item={i} />
        ))}
      </nav>

      {user && (
        <div className="px-3 py-4 border-t border-sidebar-hover shrink-0">
          <div
            className={cn(
              "flex items-center",
              sidebarCollapsed && "justify-center",
            )}
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-lg">
              {user.firstName?.[0]?.toUpperCase() || "U"}
            </div>
            {!sidebarCollapsed && (
              <div className="ml-3 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-sidebar-text truncate">
                  {role ? ROLE_LABELS[role] : "Guest"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-sidebar-bg flex flex-col z-50 sidebar-transition",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto",
          sidebarCollapsed ? "w-[68px]" : "w-64",
        )}
      >
        {content}
      </aside>
    </>
  );
}
