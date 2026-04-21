"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  FolderTree,
  LayoutDashboard,
  MessageSquare,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Tag,
  Truck,
  Users,
} from "lucide-react";
import { useRole } from "@/modules/core/rbac";
import { cn } from "@/common/utils/cn";

type Command = {
  id: string;
  label: string;
  href: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
  section: "Operate" | "Catalog" | "Storefront";
};

const ALL_COMMANDS: Command[] = [
  { id: "dashboard", label: "Dashboard", href: "/admin", keywords: "home overview", icon: LayoutDashboard, section: "Operate" },
  { id: "orders", label: "Orders", href: "/admin/orders", keywords: "purchases fulfilment", icon: ShoppingCart, section: "Operate" },
  { id: "new-product", label: "New product", href: "/admin/products/new", keywords: "create add catalog", icon: Package, section: "Catalog" },
  { id: "products", label: "Products", href: "/admin/products", keywords: "catalog items", icon: Package, section: "Catalog" },
  { id: "categories", label: "Categories", href: "/admin/categories", keywords: "taxonomy tree", icon: FolderTree, section: "Catalog" },
  { id: "coupons", label: "Coupons", href: "/admin/coupons", keywords: "discounts codes", icon: Tag, section: "Catalog" },
  { id: "reviews", label: "Reviews", href: "/admin/reviews", keywords: "moderation ratings", icon: MessageSquare, section: "Operate" },
  { id: "shipping", label: "Shipping", href: "/admin/shipping", keywords: "zones rules rates", icon: Truck, section: "Operate" },
  { id: "users", label: "Users", href: "/admin/users", keywords: "people roles staff", icon: Users, section: "Operate" },
  { id: "settings", label: "Settings", href: "/admin/settings", keywords: "config tenant", icon: Settings, section: "Operate" },
  { id: "storefront", label: "View storefront", href: "/", keywords: "customer shop home", icon: Package, section: "Storefront" },
];

export function CommandPalette() {
  const router = useRouter();
  const { role } = useRole();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const items = useMemo(() => {
    const available = ALL_COMMANDS.filter((c) => {
      if (c.id === "shipping" || c.id === "users" || c.id === "settings") {
        return role === "ADMIN" || role === "SUPERADMIN";
      }
      return true;
    });
    const s = q.trim().toLowerCase();
    if (!s) return available;
    return available.filter(
      (c) =>
        c.label.toLowerCase().includes(s) ||
        c.keywords.toLowerCase().includes(s),
    );
  }, [q, role]);

  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    items.forEach((c) => {
      if (!map.has(c.section)) map.set(c.section, []);
      map.get(c.section)!.push(c);
    });
    return map;
  }, [items]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const c = items[idx];
      if (c) {
        router.push(c.href);
        setOpen(false);
      }
    }
  };

  if (!open || !mounted) return null;

  let flatIndex = -1;

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-start justify-center pt-24 px-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xl rounded-2xl border border-card-border bg-card-bg shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in"
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-card-border">
          <Search className="h-5 w-5 text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0);
            }}
            onKeyDown={handleKey}
            placeholder="Search actions, pages…"
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted"
          />
          <kbd className="hidden sm:inline text-[10px] font-mono bg-card-border/50 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="text-center text-sm text-muted py-10">
              No matches
            </p>
          ) : (
            Array.from(grouped.entries()).map(([section, cs]) => (
              <div key={section} className="mb-1">
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {section}
                </p>
                {cs.map((c) => {
                  flatIndex += 1;
                  const active = flatIndex === idx;
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        router.push(c.href);
                        setOpen(false);
                      }}
                      onMouseMove={() => setIdx(flatIndex)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                        active
                          ? "bg-accent/10 text-accent"
                          : "text-foreground hover:bg-card-border/30",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 text-sm font-medium">
                        {c.label}
                      </span>
                      {active && (
                        <kbd className="text-[10px] font-mono bg-card-border/50 px-1.5 py-0.5 rounded">
                          ↵
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="px-3 py-2 border-t border-card-border bg-background/40 flex items-center gap-3 text-[11px] text-muted">
          <span>
            <kbd className="font-mono">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="font-mono">↵</kbd> open
          </span>
          <span className="ml-auto">
            <kbd className="font-mono">⌘K</kbd> anywhere
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
