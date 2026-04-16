"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, ShoppingCart, Settings, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const menu = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Storefront", href: "/", icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            CoreKit Admin
          </span>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  active ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
              {user.firstName[0]}
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-white">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <div className="py-6 px-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
