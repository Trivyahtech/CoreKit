"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, MapPin, Package, Phone, Star } from "lucide-react";
import { api } from "@/platform/api/client";
import { AdminPageHeader } from "@/common/components/layout/AdminPageHeader";
import { Badge, StatusBadge } from "@/common/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/common/components/ui/Card";
import { DataTable, type Column } from "@/common/components/ui/DataTable";
import { formatPrice } from "@/common/components/ui/Price";
import {
  EmptyState,
  ErrorState,
  PageLoader,
} from "@/common/components/ui/States";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  type?: string;
};

type Customer = {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string | null;
  status: string;
  emailVerifiedAt?: string | null;
  createdAt: string;
  lastLoginAt?: string | null;
  ordersCount: number;
  lifetimeValue: string;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    grandTotal: string;
    createdAt: string;
  }>;
  addresses: Address[];
  reviews: Array<{
    id: string;
    rating: number;
    title?: string | null;
    status: string;
    createdAt: string;
    product?: { id: string; name: string };
  }>;
};

type AuditLine = {
  id?: string;
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  placedAt: string;
  productId: string;
  productName: string;
  variantName?: string | null;
  sku: string;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
};

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: customer, isLoading, isError, refetch } = useQuery<Customer>({
    queryKey: ["admin-customer", id],
    queryFn: () => api.get(`/customers/${id}`),
    enabled: !!id,
  });

  const { data: audit } = useQuery<AuditLine[]>({
    queryKey: ["admin-customer-audit", id],
    queryFn: () => api.get(`/customers/${id}/audit?limit=200`),
    enabled: !!id,
  });

  if (isLoading) return <PageLoader />;
  if (isError || !customer)
    return (
      <ErrorState title="Customer not found" onRetry={() => refetch()} />
    );

  const auditCols: Column<AuditLine>[] = [
    {
      key: "date",
      header: "Placed",
      cell: (a) => (
        <time dateTime={a.placedAt} className="text-xs text-muted">
          {new Date(a.placedAt).toLocaleString()}
        </time>
      ),
    },
    {
      key: "order",
      header: "Order",
      cell: (a) => (
        <Link
          href={`/admin/orders/${a.orderId}`}
          className="font-semibold text-accent hover:underline"
        >
          {a.orderNumber}
        </Link>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (a) => <StatusBadge status={a.orderStatus} kind="order" />,
    },
    {
      key: "product",
      header: "Product",
      cell: (a) => (
        <div>
          <Link
            href={`/admin/products/${a.productId}`}
            className="font-medium text-foreground hover:text-accent"
          >
            {a.productName}
          </Link>
          {a.variantName && (
            <p className="text-xs text-muted">{a.variantName}</p>
          )}
        </div>
      ),
    },
    { key: "sku", header: "SKU", cell: (a) => <code className="text-xs font-mono">{a.sku}</code> },
    {
      key: "qty",
      header: "Qty",
      align: "right",
      cell: (a) => <span className="text-foreground">{a.quantity}</span>,
    },
    {
      key: "amount",
      header: "Total",
      align: "right",
      cell: (a) => (
        <span className="font-medium text-foreground">{formatPrice(a.totalAmount)}</span>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={`${customer.firstName} ${customer.lastName ?? ""}`}
        description={customer.email}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Customers", href: "/admin/customers" },
          { label: `${customer.firstName}` },
        ]}
        actions={
          <Link
            href="/admin/customers"
            className="inline-flex h-10 px-3 items-center gap-1.5 rounded-lg border border-card-border bg-card-bg text-sm font-semibold hover:bg-card-border/30"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Recent orders
              </h2>
            </CardHeader>
            {customer.orders.length === 0 ? (
              <CardBody>
                <p className="text-sm text-muted text-center py-4">
                  No orders yet
                </p>
              </CardBody>
            ) : (
              <ul className="divide-y divide-card-border">
                {customer.orders.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-card-border/15 transition-colors"
                    >
                      <div className="h-9 w-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground text-sm truncate">
                          {o.orderNumber}
                        </p>
                        <p className="text-xs text-muted">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={o.status} kind="order" />
                      <p className="font-semibold text-foreground min-w-[5rem] text-right">
                        {formatPrice(o.grandTotal)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Audit: products received
              </h2>
            </CardHeader>
            {!audit || audit.length === 0 ? (
              <CardBody>
                <p className="text-sm text-muted text-center py-4">
                  No line items yet
                </p>
              </CardBody>
            ) : (
              <DataTable
                columns={auditCols}
                rows={audit}
                keyBy={(r) => `${r.orderId}-${r.productId}-${r.sku}`}
                compact
              />
            )}
          </Card>

          {customer.reviews.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" /> Reviews
                </h2>
              </CardHeader>
              <ul className="divide-y divide-card-border">
                {customer.reviews.map((r) => (
                  <li key={r.id} className="p-5 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        {r.title || "(no title)"}
                      </p>
                      {r.product && (
                        <p className="text-xs text-muted mt-0.5">
                          on {r.product.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-foreground">⭐ {r.rating}</p>
                      <Badge
                        tone={
                          r.status === "APPROVED"
                            ? "success"
                            : r.status === "REJECTED"
                            ? "danger"
                            : "warning"
                        }
                        size="sm"
                      >
                        {r.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">Snapshot</h2>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Orders</dt>
                <dd className="font-semibold text-foreground">
                  {customer.ordersCount}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Lifetime value</dt>
                <dd className="font-bold text-foreground">
                  {formatPrice(customer.lifetimeValue)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Account status</dt>
                <dd>
                  <Badge
                    tone={customer.status === "ACTIVE" ? "success" : "danger"}
                  >
                    {customer.status}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Email</dt>
                <dd>
                  {customer.emailVerifiedAt ? (
                    <Badge tone="success" size="sm">
                      Verified
                    </Badge>
                  ) : (
                    <Badge tone="warning" size="sm">
                      Unverified
                    </Badge>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Joined</dt>
                <dd className="text-foreground">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </dd>
              </div>
              {customer.lastLoginAt && (
                <div className="flex justify-between">
                  <dt className="text-muted">Last login</dt>
                  <dd className="text-foreground">
                    {new Date(customer.lastLoginAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Contact
              </h2>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-foreground">
                <Mail className="h-4 w-4 text-muted" /> {customer.email}
              </p>
              {customer.phone && (
                <p className="flex items-center gap-2 text-foreground">
                  <Phone className="h-4 w-4 text-muted" /> {customer.phone}
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Addresses
              </h2>
            </CardHeader>
            {customer.addresses.length === 0 ? (
              <CardBody>
                <p className="text-sm text-muted text-center py-2">None saved</p>
              </CardBody>
            ) : (
              <ul className="divide-y divide-card-border">
                {customer.addresses.map((a) => (
                  <li key={a.id} className="p-5 text-sm text-foreground/90">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">
                          {a.fullName}{" "}
                          {a.isDefault && (
                            <Badge tone="accent" size="sm" className="ml-1">
                              Default
                            </Badge>
                          )}
                        </p>
                        <p className="text-muted text-xs">
                          {a.line1}
                          {a.line2 ? `, ${a.line2}` : ""}
                          <br />
                          {a.city}, {a.state} {a.pincode}
                          <br />
                          {a.phone}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
