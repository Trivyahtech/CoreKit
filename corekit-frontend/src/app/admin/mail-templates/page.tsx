"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, RotateCcw, Save } from "lucide-react";
import { api, ApiError } from "@/platform/api/client";
import { AdminPageHeader } from "@/common/components/layout/AdminPageHeader";
import { Badge } from "@/common/components/ui/Badge";
import { Button } from "@/common/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/common/components/ui/Card";
import { Input } from "@/common/components/ui/Input";
import { Textarea } from "@/common/components/ui/FormControls";
import { Tabs, type TabItem } from "@/common/components/ui/Tabs";
import { PageLoader } from "@/common/components/ui/States";
import { useToast } from "@/common/components/ui/Toast";

type TemplateKey =
  | "orderConfirmation"
  | "orderStatusUpdate"
  | "otp"
  | "passwordReset"
  | "emailVerification";

const TEMPLATES: Array<{
  key: TemplateKey;
  label: string;
  hint: string;
  variables: string[];
  defaultSubject: string;
  defaultHtml: string;
}> = [
  {
    key: "orderConfirmation",
    label: "Order confirmation",
    hint: "Sent to the customer after payment is authorized.",
    variables: ["customerName", "orderNumber", "grandTotal", "currency"],
    defaultSubject: "Order Confirmed — {{orderNumber}}",
    defaultHtml: `<p>Hi {{customerName}},</p>
<p>Thanks for your order <strong>{{orderNumber}}</strong>. Grand total: {{currency}} {{grandTotal}}.</p>
<p>We&rsquo;ll email you again when it ships.</p>`,
  },
  {
    key: "orderStatusUpdate",
    label: "Order status update",
    hint: "Sent whenever the order status changes.",
    variables: ["customerName", "orderNumber", "newStatus", "note"],
    defaultSubject: "Order {{orderNumber}} — {{newStatus}}",
    defaultHtml: `<p>Hi {{customerName}},</p>
<p>Your order <strong>{{orderNumber}}</strong> is now <strong>{{newStatus}}</strong>.</p>
<p>{{note}}</p>`,
  },
  {
    key: "otp",
    label: "Login OTP",
    hint: "One-time password for passwordless sign-in.",
    variables: ["code", "ttlMinutes"],
    defaultSubject: "Your verification code",
    defaultHtml: `<p>Your verification code is <strong>{{code}}</strong>.</p>
<p>It expires in {{ttlMinutes}} minutes.</p>`,
  },
  {
    key: "passwordReset",
    label: "Password reset",
    hint: "Sent when a customer requests a password reset link.",
    variables: ["resetUrl", "ttlMinutes"],
    defaultSubject: "Reset your password",
    defaultHtml: `<p>We got a request to reset your password.</p>
<p><a href="{{resetUrl}}">Reset password</a> — expires in {{ttlMinutes}} minutes.</p>`,
  },
  {
    key: "emailVerification",
    label: "Email verification",
    hint: "Sent on signup to confirm the customer&rsquo;s email.",
    variables: ["verifyUrl", "ttlMinutes"],
    defaultSubject: "Verify your email",
    defaultHtml: `<p>Welcome! Please confirm your email.</p>
<p><a href="{{verifyUrl}}">Verify email</a> — link valid for {{ttlMinutes}} minutes.</p>`,
  },
];

const TAB_ITEMS: TabItem<TemplateKey>[] = TEMPLATES.map((t) => ({
  key: t.key,
  label: t.label.split(" ")[0],
}));

type Tenant = {
  id: string;
  slug: string;
  name: string;
  settings?: {
    mailTemplates?: Partial<
      Record<TemplateKey, { subject?: string; html?: string }>
    >;
  } | null;
};

function renderPreview(
  html: string,
  vars: string[],
): string {
  return html.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, k) => {
    if (vars.includes(k)) {
      return `<span style="background:#fff4a3;padding:0 2px;border-radius:3px">[${k}]</span>`;
    }
    return _m;
  });
}

export default function AdminMailTemplatesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<TemplateKey>("orderConfirmation");

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ["tenant-current"],
    queryFn: () => api.get("/tenants/current"),
  });

  const def = useMemo(() => TEMPLATES.find((t) => t.key === tab)!, [tab]);
  const override =
    tenant?.settings?.mailTemplates?.[tab] ?? undefined;

  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");

  useEffect(() => {
    setSubject(override?.subject ?? def.defaultSubject);
    setHtml(override?.html ?? def.defaultHtml);
  }, [tab, override, def]);

  const save = useMutation({
    mutationFn: () => {
      const currentMailTemplates =
        tenant?.settings?.mailTemplates ?? {};
      return api.patch("/tenants/current", {
        settings: {
          mailTemplates: {
            ...currentMailTemplates,
            [tab]:
              subject === def.defaultSubject && html === def.defaultHtml
                ? undefined
                : { subject, html },
          },
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-current"] });
      toast({
        variant: "success",
        title: "Template saved",
        description: "The next outgoing email will use your version.",
      });
    },
    onError: (err) =>
      toast({
        variant: "error",
        title: "Couldn't save",
        description: err instanceof ApiError ? err.message : undefined,
      }),
  });

  const reset = () => {
    setSubject(def.defaultSubject);
    setHtml(def.defaultHtml);
  };

  if (isLoading) return <PageLoader />;

  const isCustomised = subject !== def.defaultSubject || html !== def.defaultHtml;

  return (
    <div>
      <AdminPageHeader
        title="Mail templates"
        description="Customize transactional email content per-tenant"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Mail templates" },
        ]}
      />

      <Tabs items={TAB_ITEMS} value={tab} onChange={setTab} className="mb-5" />

      <Card className="mb-4">
        <CardHeader className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-accent" />
          <h2 className="text-base font-semibold text-foreground">
            {def.label}
          </h2>
          {override ? (
            <Badge tone="accent">Customised</Badge>
          ) : (
            <Badge tone="neutral">Default</Badge>
          )}
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-muted">{def.hint}</p>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Available variables
            </p>
            <div className="flex flex-wrap gap-1.5">
              {def.variables.map((v) => (
                <code
                  key={v}
                  className="text-xs font-mono bg-card-border/40 px-2 py-0.5 rounded cursor-pointer hover:bg-accent/10 hover:text-accent"
                  onClick={() => {
                    if (typeof document === "undefined") return;
                    const textarea = document.querySelector<HTMLTextAreaElement>(
                      "textarea#template-html",
                    );
                    if (!textarea) return;
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const next =
                      html.slice(0, start) +
                      `{{${v}}}` +
                      html.slice(end);
                    setHtml(next);
                    setTimeout(() => {
                      textarea.focus();
                      textarea.setSelectionRange(
                        start + v.length + 4,
                        start + v.length + 4,
                      );
                    }, 0);
                  }}
                  title="Click to insert into the HTML body"
                >
                  {`{{${v}}}`}
                </code>
              ))}
            </div>
          </div>
          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <div>
            <label
              htmlFor="template-html"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              HTML body
            </label>
            <Textarea
              id="template-html"
              rows={14}
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button
              leftIcon={<Save className="h-4 w-4" />}
              loading={save.isPending}
              onClick={() => save.mutate()}
              disabled={!isCustomised && !override}
            >
              Save template
            </Button>
            <Button
              variant="outline"
              leftIcon={<RotateCcw className="h-4 w-4" />}
              onClick={reset}
              disabled={!isCustomised}
            >
              Reset to default
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-foreground">Preview</h2>
        </CardHeader>
        <CardBody>
          <div className="rounded-lg border border-card-border bg-white p-4 text-black max-h-[600px] overflow-auto">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">
              Subject
            </p>
            <p className="font-semibold mb-4 border-b pb-2">
              {subject.replace(/\{\{(\w+)\}\}/g, "[$1]")}
            </p>
            <div
              dangerouslySetInnerHTML={{
                __html: renderPreview(html, def.variables),
              }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            Yellow highlights are placeholder variables — the email processor
            replaces them with live values at send time.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
