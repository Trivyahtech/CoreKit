"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { api, ApiError, TENANT_SLUG } from "@/platform/api/client";
import { AdminPageHeader } from "@/common/components/layout/AdminPageHeader";
import { Button } from "@/common/components/ui/Button";
import { Card } from "@/common/components/ui/Card";
import { Input } from "@/common/components/ui/Input";
import { Select, Textarea } from "@/common/components/ui/FormControls";
import { Modal } from "@/common/components/ui/Modal";
import { EmptyState, ErrorState, PageLoader } from "@/common/components/ui/States";
import { useToast } from "@/common/components/ui/Toast";
import { useConfirm } from "@/common/components/ui/ConfirmDialog";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  sortOrder: number;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const EMPTY = {
  name: "",
  slug: "",
  description: "",
  parentId: "",
  sortOrder: 0,
};

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get(`/categories?tenant=${TENANT_SLUG}`),
  });

  const byParent = useMemo(() => {
    const map = new Map<string | null, Category[]>();
    for (const c of data || []) {
      const key = c.parentId || null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    for (const [, arr] of map) arr.sort((a, b) => a.sortOrder - b.sortOrder);
    return map;
  }, [data]);

  const openNew = (parentId?: string) => {
    setEditing(null);
    setForm({ ...EMPTY, parentId: parentId || "" });
    setSlugTouched(false);
    setOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      parentId: c.parentId || "",
      sortOrder: c.sortOrder,
    });
    setSlugTouched(true);
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        tenantSlug: TENANT_SLUG,
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        parentId: form.parentId || null,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (editing) return api.patch(`/categories/${editing.id}`, payload);
      return api.post("/categories", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast({
        variant: "success",
        title: editing ? "Category updated" : "Category created",
      });
      setOpen(false);
    },
    onError: (err) => {
      toast({
        variant: "error",
        title: "Couldn't save",
        description: err instanceof ApiError ? err.message : undefined,
      });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast({ variant: "success", title: "Category deleted" });
    },
    onError: (err) => {
      toast({
        variant: "error",
        title: "Couldn't delete",
        description: err instanceof ApiError ? err.message : undefined,
      });
    },
  });

  const onDelete = async (c: Category) => {
    const ok = await confirm({
      title: `Delete "${c.name}"?`,
      description: "Child categories will be orphaned.",
      tone: "danger",
      confirmLabel: "Delete",
    });
    if (ok) remove.mutate(c.id);
  };

  const renderTree = (parentId: string | null, depth = 0) => {
    const items = byParent.get(parentId) || [];
    if (items.length === 0) return null;
    return (
      <ul className={depth === 0 ? "" : "ml-6 border-l border-card-border pl-4"}>
        {items.map((c) => (
          <li key={c.id} className="py-1">
            <div className="flex items-center gap-3 group">
              {depth > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{c.name}</p>
                <p className="text-xs text-muted font-mono">{c.slug}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button
                  onClick={() => openNew(c.id)}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-card-border/40 text-muted hover:text-foreground"
                  title="Add subcategory"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openEdit(c)}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-card-border/40 text-muted hover:text-foreground"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(c)}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-danger/10 text-muted hover:text-danger"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {renderTree(c.id, depth + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Organize your catalog hierarchy"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Categories" },
        ]}
        actions={
          <Button
            onClick={() => openNew()}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            New category
          </Button>
        }
      />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories"
          description="Create your first category to start organizing products."
          action={
            <Button onClick={() => openNew()} leftIcon={<Plus className="h-4 w-4" />}>
              New category
            </Button>
          }
        />
      ) : (
        <Card className="p-4">{renderTree(null)}</Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit category" : "New category"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={save.isPending} onClick={() => save.mutate()}>
              Save
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
          <Input
            label="Name"
            required
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({
                ...f,
                name,
                slug: slugTouched ? f.slug : slugify(name),
              }));
            }}
          />
          <Input
            label="Slug"
            required
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setForm({ ...form, slug: slugify(e.target.value) });
            }}
          />
          <Select
            label="Parent category"
            value={form.parentId}
            onChange={(e) => setForm({ ...form, parentId: e.target.value })}
          >
            <option value="">— None (top-level) —</option>
            {(data || [])
              .filter((c) => !editing || c.id !== editing.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </Select>
          <Textarea
            label="Description"
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />
          <Input
            label="Sort order"
            type="number"
            value={String(form.sortOrder)}
            onChange={(e) =>
              setForm({ ...form, sortOrder: Number(e.target.value) || 0 })
            }
          />
        </form>
      </Modal>
    </div>
  );
}
