import { UserRole } from '@prisma/client';

/**
 * Permission code catalog. Resource-scoped verbs (e.g., products:read).
 * Grants are defined per role below. Treat this file as the source of truth
 * until a dynamic DB-backed permissions system is introduced.
 */
export const PERMISSIONS = {
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  PRODUCTS_PUBLISH: 'products:publish',
  PRODUCTS_DELETE: 'products:delete',

  CATEGORIES_READ: 'categories:read',
  CATEGORIES_WRITE: 'categories:write',
  CATEGORIES_DELETE: 'categories:delete',

  ORDERS_READ_OWN: 'orders:read_own',
  ORDERS_READ_ANY: 'orders:read_any',
  ORDERS_UPDATE_STATUS: 'orders:update_status',
  ORDERS_REFUND: 'orders:refund',

  SHIPPING_QUOTE: 'shipping:quote',
  SHIPPING_MANAGE: 'shipping:manage',

  USERS_READ: 'users:read',
  USERS_UPDATE_ROLE: 'users:update_role',

  PAYMENTS_INITIATE: 'payments:initiate',
  PAYMENTS_VERIFY: 'payments:verify',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const CUSTOMER_PERMS: Permission[] = [
  PERMISSIONS.PRODUCTS_READ,
  PERMISSIONS.CATEGORIES_READ,
  PERMISSIONS.ORDERS_READ_OWN,
  PERMISSIONS.PAYMENTS_INITIATE,
  PERMISSIONS.PAYMENTS_VERIFY,
  PERMISSIONS.SHIPPING_QUOTE,
];

const STAFF_PERMS: Permission[] = [
  ...CUSTOMER_PERMS,
  PERMISSIONS.PRODUCTS_WRITE,
  PERMISSIONS.PRODUCTS_PUBLISH,
  PERMISSIONS.CATEGORIES_WRITE,
  PERMISSIONS.ORDERS_READ_ANY,
  PERMISSIONS.ORDERS_UPDATE_STATUS,
  PERMISSIONS.SHIPPING_MANAGE,
  PERMISSIONS.USERS_READ,
];

const VENDOR_PERMS: Permission[] = [
  ...CUSTOMER_PERMS,
  PERMISSIONS.PRODUCTS_WRITE,
  PERMISSIONS.CATEGORIES_READ,
];

const ADMIN_PERMS: Permission[] = [
  ...STAFF_PERMS,
  PERMISSIONS.PRODUCTS_DELETE,
  PERMISSIONS.CATEGORIES_DELETE,
  PERMISSIONS.ORDERS_REFUND,
  PERMISSIONS.USERS_UPDATE_ROLE,
];

export const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  CUSTOMER: new Set(CUSTOMER_PERMS),
  VENDOR: new Set(VENDOR_PERMS),
  STAFF: new Set(STAFF_PERMS),
  ADMIN: new Set(ADMIN_PERMS),
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}
