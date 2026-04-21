"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { useTheme } from "@/platform/theme/ThemeContext";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  LogOut,
  User,
  ChevronDown,
  Settings,
  ShieldCheck,
  Package,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// Notification feed is not yet backed by an API — empty state shown until one exists.
const sampleNotifications: Array<{
  id: number;
  icon: any;
  iconColor: string;
  title: string;
  time: string;
  read: boolean;
}> = [];

export function Topbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, setSidebarOpen } = useTheme();
  const router = useRouter();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const unreadCount = sampleNotifications.filter((n) => !n.read).length;

  return (
    <header className="h-16 bg-topbar-bg border-b border-topbar-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left: Mobile menu + Search */}
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:bg-card-border/50 hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Command palette hint (⌘K) */}
        <button
          onClick={() => {
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
            );
          }}
          className="hidden sm:flex items-center gap-2 bg-background border border-card-border rounded-lg px-3 py-2 max-w-md w-full text-left text-muted hover:border-accent/40 transition-colors"
        >
          <Search className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">Jump to…</span>
          <kbd className="ml-auto text-[10px] font-mono bg-card-border/50 px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:bg-card-border/50 hover:text-foreground transition-colors"
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
            className={`relative flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:bg-card-border/50 hover:text-foreground transition-colors ${notifOpen ? "bg-card-border/50 text-foreground" : ""}`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 bg-card-bg border border-card-border rounded-xl shadow-xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              </div>
              <div className="px-5 py-10 text-center">
                <Bell className="mx-auto h-8 w-8 text-muted/40" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  You&apos;re all caught up
                </p>
                <p className="text-xs text-muted mt-0.5">
                  Notifications for new orders and low stock will appear here.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        {user && (
          <div ref={userRef} className="relative ml-1">
            <button
              onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
              className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-card-border/50 transition-colors ${userOpen ? "bg-card-border/50" : ""}`}
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow">
                {user.firstName[0]}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground leading-tight">{user.firstName}</p>
                <p className="text-[10px] text-muted leading-tight">{user.role}</p>
              </div>
              <ChevronDown className="hidden md:block h-3.5 w-3.5 text-muted" />
            </button>

            {userOpen && (
              <div className="absolute right-0 top-12 w-56 bg-card-bg border border-card-border rounded-xl shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-card-border">
                  <p className="text-sm font-medium text-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted truncate">{user.email}</p>
                </div>
                <div className="py-1">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-card-border/30 transition-colors">
                    <User className="h-4 w-4 text-muted" />
                    Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-card-border/30 transition-colors">
                    <Settings className="h-4 w-4 text-muted" />
                    Settings
                  </button>
                </div>
                <div className="border-t border-card-border py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Not logged in */}
        {!user && (
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={() => router.push("/login")}
              className="text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => router.push("/register")}
              className="text-sm font-medium text-white bg-accent hover:bg-accent/90 px-4 py-2 rounded-lg transition-colors"
            >
              Sign up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
