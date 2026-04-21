"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, Star, Trash2, Pencil } from "lucide-react";
import { api, ApiError } from "@/platform/api/client";
import { Button } from "@/common/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/common/components/ui/Card";
import { Input } from "@/common/components/ui/Input";
import { Select } from "@/common/components/ui/FormControls";
import { Modal } from "@/common/components/ui/Modal";
import { Badge } from "@/common/components/ui/Badge";
import {
  EmptyState,
  ErrorState,
  PageLoader,
} from "@/common/components/ui/States";
import { useToast } from "@/common/components/ui/Toast";
import { useConfirm } from "@/common/components/ui/ConfirmDialog";

type Address = {
  id: string;
  type: "SHIPPING" | "BILLING";
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

const EMPTY = {
  type: "SHIPPING" as "SHIPPING" | "BILLING",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
};

export default function AddressesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState(EMPTY);

  const { data: addresses, isLoading, isError, refetch } = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: () => api.get("/addresses"),
  });

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (a: Address) => {
    setEditing(a);
    setForm({
      type: a.type,
      fullName: a.fullName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 || "",
      landmark: a.landmark || "",
      city: a.city,
      state: a.state,
      pincode: a.pincode,
    });
    setModalOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        return api.patch(`/addresses/${editing.id}`, form);
      }
      return api.post("/addresses", form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      setModalOpen(false);
      toast({
        variant: "success",
        title: editing ? "Address updated" : "Address saved",
      });
    },
    onError: (err) => {
      toast({
        variant: "error",
        title: "Could not save address",
        description:
          err instanceof ApiError ? err.message : "Please try again.",
      });
    },
  });

  const setDefault = useMutation({
    mutationFn: (id: string) => api.patch(`/addresses/${id}/default`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      toast({ variant: "success", title: "Default address updated" });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/addresses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      toast({ variant: "success", title: "Address removed" });
    },
  });

  const handleDelete = async (a: Address) => {
    const ok = await confirm({
      title: "Delete this address?",
      description: "This action cannot be undone.",
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (ok) remove.mutate(a.id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Address book</h2>
          <p className="text-sm text-muted">
            Save addresses to speed up checkout
          </p>
        </div>
        <Button
          onClick={openNew}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add address
        </Button>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !addresses || addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No addresses yet"
          description="Add an address so checkout only takes seconds."
          action={
            <Button onClick={openNew} leftIcon={<Plus className="h-4 w-4" />}>
              Add your first address
            </Button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <Card key={a.id} className="relative">
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge tone={a.type === "BILLING" ? "info" : "neutral"}>
                    {a.type.toLowerCase()}
                  </Badge>
                  {a.isDefault && (
                    <Badge tone="accent">
                      <Star className="h-3 w-3 mr-1" /> Default
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(a)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-card-border/40 text-muted hover:text-foreground"
                    aria-label="Edit address"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(a)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-danger/10 text-muted hover:text-danger"
                    aria-label="Delete address"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardBody>
                <p className="font-semibold text-foreground">
                  {a.fullName} · {a.phone}
                </p>
                <p className="text-sm text-muted mt-1">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                </p>
                {a.landmark && (
                  <p className="text-sm text-muted">Near {a.landmark}</p>
                )}
                <p className="text-sm text-muted">
                  {a.city}, {a.state} {a.pincode}
                </p>
                {!a.isDefault && (
                  <button
                    onClick={() => setDefault.mutate(a.id)}
                    disabled={setDefault.isPending}
                    className="mt-3 text-xs font-semibold text-accent hover:text-accent/80"
                  >
                    Set as default
                  </button>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit address" : "Add address"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={save.isPending} onClick={() => save.mutate()}>
              {editing ? "Save changes" : "Save address"}
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value as "SHIPPING" | "BILLING",
                })
              }
            >
              <option value="SHIPPING">Shipping</option>
              <option value="BILLING">Billing</option>
            </Select>
            <Input
              label="Phone"
              inputMode="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <Input
            label="Full name"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <Input
            label="Address line 1"
            required
            value={form.line1}
            onChange={(e) => setForm({ ...form, line1: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Address line 2 (optional)"
              value={form.line2}
              onChange={(e) => setForm({ ...form, line2: e.target.value })}
            />
            <Input
              label="Landmark (optional)"
              value={form.landmark}
              onChange={(e) => setForm({ ...form, landmark: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="City"
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <Input
              label="State"
              required
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
            <Input
              label="PIN code"
              inputMode="numeric"
              required
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
