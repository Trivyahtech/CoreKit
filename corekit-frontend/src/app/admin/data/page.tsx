"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  Download,
  FileUp,
  Shield,
  Trash2,
  Upload,
} from "lucide-react";
import { api, ApiError } from "@/platform/api/client";
import { AdminPageHeader } from "@/common/components/layout/AdminPageHeader";
import { Badge } from "@/common/components/ui/Badge";
import { Button } from "@/common/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/common/components/ui/Card";
import { Input } from "@/common/components/ui/Input";
import { Select } from "@/common/components/ui/FormControls";
import { useToast } from "@/common/components/ui/Toast";
import { useConfirm } from "@/common/components/ui/ConfirmDialog";

const EXPORT_SCOPES = [
  { id: "products", label: "Products + variants" },
  { id: "categories", label: "Categories" },
  { id: "customers", label: "Customers" },
  { id: "orders", label: "Orders (flattened by line item)" },
  { id: "coupons", label: "Coupons" },
  { id: "inventory-ledger", label: "Inventory ledger (audit)" },
];

const IMPORT_SCOPES = [
  { id: "products", label: "Products + variants" },
  { id: "categories", label: "Categories" },
  { id: "coupons", label: "Coupons" },
];

const PURGE_SCOPES = [
  {
    id: "draft-products",
    label: "Draft products",
    danger: "medium",
    hint: "Removes products still in DRAFT. Published products are kept.",
  },
  {
    id: "cancelled-orders",
    label: "Cancelled orders",
    danger: "high",
    hint: "Deletes every order in CANCELLED status. Irreversible. Keep for audit if possible.",
  },
  {
    id: "carts",
    label: "Empty active carts",
    danger: "low",
    hint: "Removes active carts that hold no items.",
  },
  {
    id: "pending-reviews",
    label: "Pending reviews",
    danger: "medium",
    hint: "Removes all PENDING reviews (unmoderated).",
  },
  {
    id: "stock-ledger",
    label: "Old stock ledger (>180d)",
    danger: "high",
    hint: "Audit log entries older than 180 days. Consider exporting first.",
  },
];

async function downloadExport(scope: string) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const base = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
  const res = await fetch(`${base}/admin/export/${scope}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError(res.status, { message: "Export failed" });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${scope}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}

async function uploadImport(scope: string, file: File) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const base = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${base}/admin/import/${scope}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const json = await res.json();
  if (!res.ok) throw new ApiError(res.status, json);
  return json.data ?? json;
}

export default function AdminDataPage() {
  const { toast } = useToast();
  const confirm = useConfirm();
  const inputRef = useRef<HTMLInputElement>(null);
  const [importScope, setImportScope] = useState("products");

  const [purgeState, setPurgeState] = useState<Record<
    string,
    { count: number; confirmToken: string; typed: string } | null
  >>({});

  const doExport = useMutation({
    mutationFn: (scope: string) => downloadExport(scope),
    onError: (err) =>
      toast({
        variant: "error",
        title: "Export failed",
        description: err instanceof ApiError ? err.message : undefined,
      }),
  });

  const doImport = useMutation({
    mutationFn: ({ scope, file }: { scope: string; file: File }) =>
      uploadImport(scope, file),
    onSuccess: (result) => {
      toast({
        variant: "success",
        title: "Import complete",
        description: JSON.stringify(result).slice(0, 200),
      });
    },
    onError: (err) =>
      toast({
        variant: "error",
        title: "Import failed",
        description: err instanceof ApiError ? err.message : undefined,
      }),
  });

  const preview = useMutation({
    mutationFn: (scope: string) =>
      api.post(`/admin/purge/${scope}/preview`, {}),
    onSuccess: (res, scope) => {
      setPurgeState((s) => ({
        ...s,
        [scope]: { count: res.count, confirmToken: res.confirmToken, typed: "" },
      }));
    },
    onError: (err) =>
      toast({
        variant: "error",
        title: "Preview failed",
        description: err instanceof ApiError ? err.message : undefined,
      }),
  });

  const executePurge = useMutation({
    mutationFn: ({ scope, token }: { scope: string; token: string }) =>
      api.post(`/admin/purge/${scope}`, { confirmToken: token }),
    onSuccess: (res, vars) => {
      toast({
        variant: "success",
        title: `Purged ${res.deleted} rows`,
        description: `Scope: ${vars.scope}`,
      });
      setPurgeState((s) => ({ ...s, [vars.scope]: null }));
    },
    onError: (err) =>
      toast({
        variant: "error",
        title: "Purge failed",
        description: err instanceof ApiError ? err.message : undefined,
      }),
  });

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    doImport.mutate({ scope: importScope, file: f });
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <AdminPageHeader
        title="Data"
        description="Import, export and purge your store data"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Data" }]}
      />

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Download className="h-5 w-5 text-accent" />
            <h2 className="text-base font-semibold text-foreground">
              Export (CSV)
            </h2>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-muted mb-4">
              Download a CSV snapshot. Exports are filtered to your tenant.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXPORT_SCOPES.map((s) => (
                <Button
                  key={s.id}
                  variant="outline"
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={() => doExport.mutate(s.id)}
                  loading={doExport.isPending && doExport.variables === s.id}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-accent" />
            <h2 className="text-base font-semibold text-foreground">
              Import (CSV)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-sm text-muted">
              Upload a CSV matching the export format for the same scope.
              Rows are upserted; missing rows are left alone.
            </p>
            <Select
              label="Scope"
              value={importScope}
              onChange={(e) => setImportScope(e.target.value)}
            >
              {IMPORT_SCOPES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".csv,text/csv"
                ref={inputRef}
                onChange={onImportFile}
                hidden
              />
              <Button
                leftIcon={<Upload className="h-4 w-4" />}
                loading={doImport.isPending}
                onClick={() => inputRef.current?.click()}
              >
                Upload &amp; import
              </Button>
              <span className="text-xs text-muted">
                Tip: export the same scope first to get the exact header row.
              </span>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6 border-danger/30">
        <CardHeader className="flex items-center gap-2 border-danger/30">
          <AlertTriangle className="h-5 w-5 text-danger" />
          <h2 className="text-base font-semibold text-foreground">
            Purge data
          </h2>
          <Badge tone="danger">Danger zone</Badge>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-muted">
            Two-step safety: click <strong>Preview</strong>, review the row
            count, then type the scope name to confirm. Purges are scoped to
            your tenant and can be permanent.
          </p>
          <div className="space-y-3">
            {PURGE_SCOPES.map((s) => {
              const state = purgeState[s.id];
              const confirmed = state && state.typed.trim() === s.id;
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-card-border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {s.label}
                        </p>
                        <Badge
                          tone={
                            s.danger === "high"
                              ? "danger"
                              : s.danger === "medium"
                              ? "warning"
                              : "neutral"
                          }
                          size="sm"
                        >
                          {s.danger}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted mt-0.5">{s.hint}</p>
                      {state && (
                        <p className="mt-2 text-sm text-foreground">
                          <strong>{state.count}</strong> row
                          {state.count === 1 ? "" : "s"} will be removed.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!state ? (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Shield className="h-4 w-4" />}
                          loading={preview.isPending && preview.variables === s.id}
                          onClick={() => preview.mutate(s.id)}
                        >
                          Preview
                        </Button>
                      ) : (
                        <>
                          <Input
                            placeholder={`type "${s.id}"`}
                            value={state.typed}
                            onChange={(e) =>
                              setPurgeState((prev) => ({
                                ...prev,
                                [s.id]: { ...state, typed: e.target.value },
                              }))
                            }
                            className="w-56"
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Trash2 className="h-4 w-4" />}
                            disabled={!confirmed || state.count === 0}
                            loading={
                              executePurge.isPending &&
                              executePurge.variables?.scope === s.id
                            }
                            onClick={async () => {
                              const ok = await confirm({
                                title: `Purge ${state.count} row${state.count === 1 ? "" : "s"}?`,
                                description: `This cannot be undone. Scope: ${s.id}`,
                                tone: "danger",
                                confirmLabel: "Purge",
                              });
                              if (ok)
                                executePurge.mutate({
                                  scope: s.id,
                                  token: state.confirmToken,
                                });
                            }}
                          >
                            Purge
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setPurgeState((prev) => ({
                                ...prev,
                                [s.id]: null,
                              }))
                            }
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
