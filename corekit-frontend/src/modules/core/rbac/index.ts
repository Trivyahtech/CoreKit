"use client";

import { useAuth } from "@/modules/core/auth/AuthContext";

// SOP §3.2: single-vendor D2C — no VENDOR role UI surface
export type Role = "ADMIN" | "STAFF" | "CUSTOMER" | "SUPERADMIN";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  SUPERADMIN: "Super admin",
  STAFF: "Staff",
  CUSTOMER: "Customer",
};

const ROLE_RANK: Record<Role, number> = {
  CUSTOMER: 1,
  STAFF: 3,
  ADMIN: 4,
  SUPERADMIN: 5,
};

export function hasRole(role: string | undefined, allowed: Role[]): boolean {
  if (!role) return false;
  return allowed.includes(role as Role);
}

export function hasAtLeast(role: string | undefined, min: Role): boolean {
  if (!role) return false;
  const r = ROLE_RANK[role as Role] ?? 0;
  return r >= ROLE_RANK[min];
}

export function useRole() {
  const { user, isLoading } = useAuth();
  const role = (user?.role as Role | undefined) ?? undefined;
  return {
    role,
    isLoading,
    is: (roles: Role | Role[]) =>
      Array.isArray(roles) ? hasRole(role, roles) : role === roles,
    atLeast: (min: Role) => hasAtLeast(role, min),
    isAdmin: hasRole(role, ["ADMIN", "SUPERADMIN"]),
    isStaff: hasRole(role, ["STAFF", "ADMIN", "SUPERADMIN"]),
    isCustomer: hasRole(role, ["CUSTOMER"]),
    canManageCatalog: hasRole(role, ["ADMIN", "STAFF", "SUPERADMIN"]),
    canManageOrders: hasRole(role, ["ADMIN", "STAFF", "SUPERADMIN"]),
    canDeleteProducts: hasRole(role, ["ADMIN", "SUPERADMIN"]),
    canManageUsers: hasRole(role, ["ADMIN", "SUPERADMIN"]),
    canModerateReviews: hasRole(role, ["ADMIN", "STAFF", "SUPERADMIN"]),
    canManageShipping: hasRole(role, ["ADMIN", "SUPERADMIN"]),
    canManageCoupons: hasRole(role, ["ADMIN", "STAFF", "SUPERADMIN"]),
    canManageSettings: hasRole(role, ["ADMIN", "SUPERADMIN"]),
  };
}
