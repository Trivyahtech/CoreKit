"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe, Moon, Palette, Save, Sun } from "lucide-react";
import { api, ApiError } from "@/platform/api/client";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { useTheme } from "@/platform/theme/ThemeContext";
import { AdminPageHeader } from "@/common/components/layout/AdminPageHeader";
import { Button } from "@/common/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/common/components/ui/Card";
import { Input } from "@/common/components/ui/Input";
import { Switch } from "@/common/components/ui/FormControls";
import { PageLoader } from "@/common/components/ui/States";
import { useToast } from "@/common/components/ui/Toast";

type Tenant = {
  id: string;
  slug: string;
  name: string;
  currencyCode: string;
  defaultCountry: string;
  timezone: string;
  settings?: {
    supportEmail?: string;
    supportPhone?: string;
    taxRate?: number;
    shippingEnabled?: boolean;
    freeShippingThreshold?: number | null;
    codEnabled?: boolean;
  } | null;
};

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ["tenant-current"],
    queryFn: () => api.get("/tenants/current"),
    enabled: !!user,
  });

  const [form, setForm] = useState({
    name: "",
    currencyCode: "INR",
    timezone: "Asia/Kolkata",
    supportEmail: "",
    supportPhone: "",
    taxRate: "18",
    shippingEnabled: true,
    codEnabled: true,
    freeShippingThreshold: "",
  });

  useEffect(() => {
    if (tenant) {
      const s = tenant.settings ?? {};
      setForm({
        name: tenant.name,
        currencyCode: tenant.currencyCode,
        timezone: tenant.timezone,
        supportEmail: (s.supportEmail as string) ?? "",
        supportPhone: (s.supportPhone as string) ?? "",
        taxRate:
          s.taxRate !== undefined && s.taxRate !== null
            ? String(Number(s.taxRate) * 100)
            : "18",
        shippingEnabled: s.shippingEnabled !== false,
        codEnabled: s.codEnabled !== false,
        freeShippingThreshold:
          s.freeShippingThreshold != null
            ? String(s.freeShippingThreshold)
            : "",
      });
    }
  }, [tenant]);

  const save = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = {
        name: form.name,
        currencyCode: form.currencyCode,
        timezone: form.timezone,
        settings: {
          supportEmail: form.supportEmail || undefined,
          supportPhone: form.supportPhone || undefined,
          taxRate: form.taxRate ? Number(form.taxRate) / 100 : undefined,
          shippingEnabled: form.shippingEnabled,
          codEnabled: form.codEnabled,
          freeShippingThreshold: form.freeShippingThreshold
            ? Number(form.freeShippingThreshold)
            : null,
        },
      };
      return api.patch("/tenants/current", body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-current"] });
      toast({ variant: "success", title: "Settings saved" });
    },
    onError: (err) =>
      toast({
        variant: "error",
        title: "Couldn't save",
        description: err instanceof ApiError ? err.message : undefined,
      }),
  });

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Store configuration and defaults"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Settings" },
        ]}
      />

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-accent" />
                <h2 className="text-base font-semibold text-foreground">
                  Store
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Store name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Currency"
                    value={form.currencyCode}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        currencyCode: e.target.value.toUpperCase(),
                      })
                    }
                  />
                  <Input
                    label="Timezone"
                    value={form.timezone}
                    onChange={(e) =>
                      setForm({ ...form, timezone: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Support email"
                    type="email"
                    value={form.supportEmail}
                    onChange={(e) =>
                      setForm({ ...form, supportEmail: e.target.value })
                    }
                  />
                  <Input
                    label="Support phone"
                    value={form.supportPhone}
                    onChange={(e) =>
                      setForm({ ...form, supportPhone: e.target.value })
                    }
                  />
                </div>
                <Input
                  label="Default tax rate (%)"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={form.taxRate}
                  onChange={(e) =>
                    setForm({ ...form, taxRate: e.target.value })
                  }
                  hint="GST charged on taxable products"
                />
                <Input
                  label="Free shipping above (₹)"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.freeShippingThreshold}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      freeShippingThreshold: e.target.value,
                    })
                  }
                  hint="Leave blank to never auto-waive shipping"
                />
                <Switch
                  checked={form.shippingEnabled}
                  onChange={(v) => setForm({ ...form, shippingEnabled: v })}
                  label="Shipping enabled"
                  description="When off, customers can check out without shipping quotes"
                />
                <Switch
                  checked={form.codEnabled}
                  onChange={(v) => setForm({ ...form, codEnabled: v })}
                  label="Allow Cash on Delivery"
                  description="Controls COD availability across checkout"
                />
                <div>
                  <Button
                    leftIcon={<Save className="h-4 w-4" />}
                    onClick={() => save.mutate()}
                    loading={save.isPending}
                  >
                    Save settings
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-accent" />
                <h2 className="text-base font-semibold text-foreground">
                  Appearance
                </h2>
              </CardHeader>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {theme === "light" ? (
                      <Sun className="h-5 w-5 text-accent" />
                    ) : (
                      <Moon className="h-5 w-5 text-accent" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Dark mode
                      </p>
                      <p className="text-xs text-muted">
                        Applies to admin and storefront
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onChange={toggleTheme}
                  />
                </div>
              </CardBody>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-foreground">
                  Tenant
                </h2>
              </CardHeader>
              <CardBody className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Slug</dt>
                  <dd className="font-mono text-foreground">
                    {tenant?.slug}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Signed in as</dt>
                  <dd className="text-foreground truncate ml-2">
                    {user?.email}
                  </dd>
                </div>
              </CardBody>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
