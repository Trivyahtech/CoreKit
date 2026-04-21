"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Truck, Pencil, Trash2 } from "lucide-react";
import { api, ApiError } from "@/platform/api/client";
import { AdminPageHeader } from "@/common/components/layout/AdminPageHeader";
import { Button } from "@/common/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/common/components/ui/Card";
import { Input } from "@/common/components/ui/Input";
import { Select, Switch, Textarea } from "@/common/components/ui/FormControls";
import { Modal } from "@/common/components/ui/Modal";
import { Badge } from "@/common/components/ui/Badge";
import { formatPrice } from "@/common/components/ui/Price";
import {
  EmptyState,
  ErrorState,
  PageLoader,
} from "@/common/components/ui/States";
import { useToast } from "@/common/components/ui/Toast";
import { useConfirm } from "@/common/components/ui/ConfirmDialog";

type ShippingRule = {
  id: string;
  name: string;
  method: "STANDARD" | "EXPRESS" | "SAME_DAY" | "PICKUP";
  flatRate: string | null;
  ratePerKg: string | null;
  minOrderValue: string | null;
  minWeightGrams: number | null;
  maxWeightGrams: number | null;
  isCodAllowed: boolean;
  isActive: boolean;
};

type Zone = {
  id: string;
  name: string;
  type: "PINCODE" | "REGION";
  pincodes: string[];
  rules?: ShippingRule[];
  isActive: boolean;
};

const EMPTY_ZONE = {
  name: "",
  pincodes: "",
  isActive: true,
};

const EMPTY_RULE = {
  name: "",
  method: "STANDARD" as ShippingRule["method"],
  flatRate: "0",
  ratePerKg: "",
  minOrderValue: "",
  minWeightGrams: "",
  maxWeightGrams: "",
  isCodAllowed: true,
  isActive: true,
};

export default function AdminShippingPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [zoneOpen, setZoneOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [zoneForm, setZoneForm] = useState(EMPTY_ZONE);

  const [ruleOpen, setRuleOpen] = useState(false);
  const [ruleZoneId, setRuleZoneId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null);
  const [ruleForm, setRuleForm] = useState(EMPTY_RULE);

  const { data: zones, isLoading, isError, refetch } = useQuery<Zone[]>({
    queryKey: ["admin-shipping-zones"],
    queryFn: () => api.get("/shipping/zones"),
  });

  const openNewZone = () => {
    setEditingZone(null);
    setZoneForm(EMPTY_ZONE);
    setZoneOpen(true);
  };
  const openEditZone = (z: Zone) => {
    setEditingZone(z);
    setZoneForm({
      name: z.name,
      pincodes: z.pincodes.join(", "),
      isActive: z.isActive,
    });
    setZoneOpen(true);
  };

  const saveZone = useMutation({
    mutationFn: () => {
      const payload = {
        name: zoneForm.name,
        type: "PINCODE" as const,
        pincodes: zoneForm.pincodes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        isActive: zoneForm.isActive,
      };
      if (editingZone)
        return api.patch(`/shipping/zones/${editingZone.id}`, payload);
      return api.post("/shipping/zones", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shipping-zones"] });
      toast({
        variant: "success",
        title: editingZone ? "Zone updated" : "Zone created",
      });
      setZoneOpen(false);
    },
    onError: (err) =>
      toast({
        variant: "error",
        title: "Couldn't save zone",
        description: err instanceof ApiError ? err.message : undefined,
      }),
  });

  const deleteZone = useMutation({
    mutationFn: (id: string) => api.delete(`/shipping/zones/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shipping-zones"] });
      toast({ variant: "success", title: "Zone deleted" });
    },
    onError: (err) =>
      toast({
        variant: "error",
        title: "Couldn't delete",
        description: err instanceof ApiError ? err.message : undefined,
      }),
  });

  const openNewRule = (zoneId: string) => {
    setRuleZoneId(zoneId);
    setEditingRule(null);
    setRuleForm(EMPTY_RULE);
    setRuleOpen(true);
  };
  const openEditRule = (zoneId: string, r: ShippingRule) => {
    setRuleZoneId(zoneId);
    setEditingRule(r);
    setRuleForm({
      name: r.name,
      method: r.method,
      flatRate: r.flatRate ? String(r.flatRate) : "0",
      ratePerKg: r.ratePerKg ? String(r.ratePerKg) : "",
      minOrderValue: r.minOrderValue ? String(r.minOrderValue) : "",
      minWeightGrams: r.minWeightGrams ? String(r.minWeightGrams) : "",
      maxWeightGrams: r.maxWeightGrams ? String(r.maxWeightGrams) : "",
      isCodAllowed: r.isCodAllowed,
      isActive: r.isActive,
    });
    setRuleOpen(true);
  };

  const saveRule = useMutation({
    mutationFn: () => {
      const num = (v: string) => (v.trim() === "" ? undefined : Number(v));
      const payload = {
        name: ruleForm.name,
        method: ruleForm.method,
        flatRate: num(ruleForm.flatRate) ?? 0,
        ratePerKg: num(ruleForm.ratePerKg),
        minOrderValue: num(ruleForm.minOrderValue),
        minWeightGrams: num(ruleForm.minWeightGrams),
        maxWeightGrams: num(ruleForm.maxWeightGrams),
        isCodAllowed: ruleForm.isCodAllowed,
        isActive: ruleForm.isActive,
      };
      if (editingRule)
        return api.patch(`/shipping/rules/${editingRule.id}`, payload);
      return api.post(`/shipping/zones/${ruleZoneId}/rules`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shipping-zones"] });
      toast({
        variant: "success",
        title: editingRule ? "Rule updated" : "Rule added",
      });
      setRuleOpen(false);
    },
    onError: (err) =>
      toast({
        variant: "error",
        title: "Couldn't save rule",
        description: err instanceof ApiError ? err.message : undefined,
      }),
  });

  const deleteRule = useMutation({
    mutationFn: (id: string) => api.delete(`/shipping/rules/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shipping-zones"] });
      toast({ variant: "success", title: "Rule removed" });
    },
  });

  const onDeleteZone = async (z: Zone) => {
    const ok = await confirm({
      title: `Delete zone "${z.name}"?`,
      description: "All rules under this zone will also be removed.",
      tone: "danger",
      confirmLabel: "Delete",
    });
    if (ok) deleteZone.mutate(z.id);
  };
  const onDeleteRule = async (r: ShippingRule) => {
    const ok = await confirm({
      title: `Remove rule "${r.name}"?`,
      tone: "danger",
      confirmLabel: "Remove",
    });
    if (ok) deleteRule.mutate(r.id);
  };

  return (
    <div>
      <AdminPageHeader
        title="Shipping"
        description="Zones and rate rules for delivery"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Shipping" },
        ]}
        actions={
          <Button onClick={openNewZone} leftIcon={<Plus className="h-4 w-4" />}>
            New zone
          </Button>
        }
      />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !zones || zones.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No shipping zones"
          description="Create a zone to start charging shipping fees based on location."
          action={
            <Button onClick={openNewZone} leftIcon={<Plus className="h-4 w-4" />}>
              New zone
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {zones.map((z) => (
            <Card key={z.id}>
              <CardHeader className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">
                      {z.name}
                    </h3>
                    {z.isActive ? (
                      <Badge tone="success">Active</Badge>
                    ) : (
                      <Badge tone="neutral">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {z.pincodes.length} pincode
                    {z.pincodes.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditZone(z)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-card-border/40 text-muted hover:text-foreground"
                    aria-label="Edit zone"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteZone(z)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-danger/10 text-muted hover:text-danger"
                    aria-label="Delete zone"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardBody>
                {z.rules && z.rules.length > 0 ? (
                  <ul className="divide-y divide-card-border -my-2">
                    {z.rules.map((r) => (
                      <li key={r.id} className="py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {r.name}{" "}
                            <span className="ml-1 text-xs text-muted font-normal">
                              · {r.method}
                            </span>
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            Flat {formatPrice(r.flatRate)}
                            {r.ratePerKg && Number(r.ratePerKg) > 0 &&
                              ` + ${formatPrice(r.ratePerKg)}/kg`}
                            {r.minOrderValue &&
                              Number(r.minOrderValue) > 0 &&
                              ` · Min order ${formatPrice(r.minOrderValue)}`}
                          </p>
                        </div>
                        {r.isCodAllowed && <Badge tone="info">COD</Badge>}
                        <button
                          onClick={() => openEditRule(z.id, r)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-card-border/40 text-muted hover:text-foreground"
                          aria-label="Edit rule"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteRule(r)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-danger/10 text-muted hover:text-danger"
                          aria-label="Remove rule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No rules in this zone.</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => openNewRule(z.id)}
                  className="mt-3"
                >
                  Add rule
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={zoneOpen}
        onClose={() => setZoneOpen(false)}
        title={editingZone ? "Edit zone" : "New zone"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setZoneOpen(false)}>
              Cancel
            </Button>
            <Button loading={saveZone.isPending} onClick={() => saveZone.mutate()}>
              Save zone
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveZone.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Zone name"
            required
            value={zoneForm.name}
            onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
          />
          <Textarea
            label="Pincodes"
            rows={4}
            hint="Comma-separated list of PIN codes"
            value={zoneForm.pincodes}
            onChange={(e) =>
              setZoneForm({ ...zoneForm, pincodes: e.target.value })
            }
          />
          <Switch
            checked={zoneForm.isActive}
            onChange={(v) => setZoneForm({ ...zoneForm, isActive: v })}
            label="Active"
            description="Inactive zones do not quote shipping"
          />
        </form>
      </Modal>

      <Modal
        open={ruleOpen}
        onClose={() => setRuleOpen(false)}
        title={editingRule ? "Edit rule" : "New rule"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setRuleOpen(false)}>
              Cancel
            </Button>
            <Button loading={saveRule.isPending} onClick={() => saveRule.mutate()}>
              Save rule
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveRule.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Rule name"
            required
            value={ruleForm.name}
            onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Method"
              value={ruleForm.method}
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  method: e.target.value as ShippingRule["method"],
                })
              }
            >
              <option value="STANDARD">Standard</option>
              <option value="EXPRESS">Express</option>
              <option value="SAME_DAY">Same day</option>
              <option value="PICKUP">Pickup</option>
            </Select>
            <Input
              label="Flat rate (₹)"
              type="number"
              min={0}
              step="0.01"
              value={ruleForm.flatRate}
              onChange={(e) =>
                setRuleForm({ ...ruleForm, flatRate: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Per-kg rate (₹, optional)"
              type="number"
              min={0}
              step="0.01"
              value={ruleForm.ratePerKg}
              onChange={(e) =>
                setRuleForm({ ...ruleForm, ratePerKg: e.target.value })
              }
            />
            <Input
              label="Min order value (₹)"
              type="number"
              min={0}
              step="0.01"
              value={ruleForm.minOrderValue}
              onChange={(e) =>
                setRuleForm({ ...ruleForm, minOrderValue: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min weight (g)"
              type="number"
              min={0}
              value={ruleForm.minWeightGrams}
              onChange={(e) =>
                setRuleForm({ ...ruleForm, minWeightGrams: e.target.value })
              }
            />
            <Input
              label="Max weight (g)"
              type="number"
              min={0}
              value={ruleForm.maxWeightGrams}
              onChange={(e) =>
                setRuleForm({ ...ruleForm, maxWeightGrams: e.target.value })
              }
            />
          </div>
          <Switch
            checked={ruleForm.isCodAllowed}
            onChange={(v) => setRuleForm({ ...ruleForm, isCodAllowed: v })}
            label="Cash on Delivery allowed"
          />
          <Switch
            checked={ruleForm.isActive}
            onChange={(v) => setRuleForm({ ...ruleForm, isActive: v })}
            label="Active"
          />
        </form>
      </Modal>
    </div>
  );
}
