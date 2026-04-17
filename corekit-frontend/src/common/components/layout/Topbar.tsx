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

const sampleNotifications = [
  {
    id: 1,
    icon: Package,
    iconColor: "text-accent bg-accent-light",
    title: "New order received",
    time: "2 min ago",
    read: false,
  },
  {
    id: 2,
    icon: User,
    iconColor: "text-success bg-emerald-100 dark:bg-emerald-900/30",
    title: "New user registration",
    time: "15 min ago",
    read: false,
  },
  {
    id: 3,
    icon: AlertTriangle,
    iconColor: "text-warning bg-amber-100 dark:bg-amber-900/30",
    title: "Low stock alert: Product SKU-001",
    time: "1 hour ago",
    read: true,
  },
  {
    id: 4,
    icon: CheckCircle,
    iconColor: "text-success bg-emerald-100 dark:bg-emerald-900/30",
    title: "Payment verified successfully",
    time: "3 hours ago",
    read: true,
  },
  {
    id: 5,
    icon: ShieldCheck,
    iconColor: "text-accent bg-accent-light",
    title: "Security scan completed",
    time: "5 hours ago",
    read: true,
  },
];

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

        {/* Search */}
        <div className="hidden sm:flex items-center bg-background border border-card-border rounded-lg px-3 py-2 max-w-md w-full transition-colors focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/30">
          <Search className="h-4 w-4 text-muted mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-transparent text-sm text-foreground placeholder-muted outline-none"
          />
        </div>
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
                <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} new
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {sampleNotifications.map((notif) => {
                  const Icon = notif.icon;
                  return (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-card-border/30 transition-colors cursor-pointer ${
                        !notif.read ? "bg-accent/5" : ""
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${notif.iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${notif.read ? "text-muted" : "text-foreground font-medium"}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-muted mt-0.5">{notif.time}</p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-card-border px-4 py-2.5">
                <button className="text-xs text-accent font-medium hover:underline w-full text-center">
                  View all notifications
                </button>
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
