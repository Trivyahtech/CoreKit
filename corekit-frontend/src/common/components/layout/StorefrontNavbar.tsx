"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  Moon,
  Package,
  Search,
  ShoppingCart,
  Sun,
  User,
  UserCircle,
  X,
} from "lucide-react";
import { api } from "@/platform/api/client";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { useTheme } from "@/platform/theme/ThemeContext";
import { useWishlist } from "@/modules/storefront/wishlist/WishlistContext";
import { CartDrawer } from "@/common/components/shop/CartDrawer";
import { cn } from "@/common/utils/cn";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/categories", label: "Categories" },
];

export function StorefrontNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setUserOpen(false);
    setCartOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => api.get("/cart"),
    enabled: !!user,
    staleTime: 30_000,
  });

  const cartCount = cart?.items?.reduce(
    (sum: number, it: { quantity: number }) => sum + it.quantity,
    0,
  ) ?? 0;

  const { count: wishCount } = useWishlist();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQ.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  };

  const handleLogout = () => {
    logout();
    setUserOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 bg-topbar-bg/95 backdrop-blur border-b border-topbar-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4">
          <button
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-card-border/40"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-sky-500 to-amber-500 tracking-tight">
              Mission NCC
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive(l.href)
                    ? "text-accent"
                    : "text-foreground/80 hover:text-foreground hover:bg-card-border/30",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <form
            onSubmit={onSearch}
            className="hidden md:flex flex-1 max-w-md ml-auto lg:ml-4"
            role="search"
          >
            <label className="sr-only" htmlFor="site-search">Search products</label>
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                id="site-search"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search products..."
                className="w-full h-10 pl-9 pr-3 bg-background border border-card-border rounded-full text-sm text-foreground placeholder:text-muted/70 outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
              />
            </div>
          </form>

          <div className="flex items-center gap-1 ml-auto md:ml-0">
            <button
              onClick={toggleTheme}
              className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-card-border/40 hover:text-foreground"
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            <Link
              href="/wishlist"
              className="relative hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-card-border/40"
              aria-label={`Wishlist${wishCount ? `, ${wishCount} items` : ""}`}
            >
              <Heart className="h-5 w-5" />
              {wishCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 inline-flex items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                  {wishCount > 99 ? "99+" : wishCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => (user ? setCartOpen(true) : router.push("/login?next=/cart"))}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-card-border/40"
              aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`}
            >
              <ShoppingCart className="h-5 w-5" />
              {user && cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 inline-flex items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            {user ? (
              <div ref={userRef} className="relative">
                <button
                  onClick={() => setUserOpen((v) => !v)}
                  className="flex items-center gap-2 pl-1 pr-2 h-10 rounded-lg hover:bg-card-border/40"
                  aria-haspopup="menu"
                  aria-expanded={userOpen}
                >
                  <span className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                    {user.firstName?.[0]?.toUpperCase() || "U"}
                  </span>
                  <ChevronDown className="hidden md:block h-3.5 w-3.5 text-muted" />
                </button>
                {userOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-12 w-56 bg-card-bg border border-card-border rounded-xl shadow-lg overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-card-border">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/account"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-card-border/30"
                      >
                        <UserCircle className="h-4 w-4 text-muted" /> My account
                      </Link>
                      <Link
                        href="/orders"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-card-border/30"
                      >
                        <Package className="h-4 w-4 text-muted" /> My orders
                      </Link>
                      <Link
                        href="/wishlist"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-card-border/30"
                      >
                        <Heart className="h-4 w-4 text-muted" /> Wishlist
                      </Link>
                      {(user.role === "ADMIN" ||
                        user.role === "STAFF" ||
                        user.role === "SUPERADMIN") && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-card-border/30"
                        >
                          <User className="h-4 w-4 text-muted" /> Admin dashboard
                        </Link>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 border-t border-card-border"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link
                  href="/login"
                  className="text-sm font-medium text-foreground/80 hover:text-foreground px-3 py-2"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex h-10 items-center px-4 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden pb-4 border-t border-card-border -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 space-y-3">
            <form onSubmit={onSearch} role="search" className="md:hidden">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search products..."
                  className="w-full h-10 pl-9 pr-3 bg-background border border-card-border rounded-full text-sm"
                />
              </div>
            </form>
            <nav className="flex flex-col">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "px-3 py-2.5 rounded-lg text-sm font-medium",
                    isActive(l.href)
                      ? "bg-accent/10 text-accent"
                      : "text-foreground hover:bg-card-border/30",
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
