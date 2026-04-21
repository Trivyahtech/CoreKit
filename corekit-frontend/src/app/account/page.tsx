"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle2,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Moon,
  Palette,
  Save,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { api, ApiError, TENANT_SLUG } from "@/platform/api/client";
import { useToast } from "@/common/components/ui/Toast";
import { useTheme } from "@/platform/theme/ThemeContext";
import { useRole, ROLE_LABELS } from "@/modules/core/rbac";
import { Button } from "@/common/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/common/components/ui/Card";
import { Input } from "@/common/components/ui/Input";
import { Switch } from "@/common/components/ui/FormControls";
import { Tabs, type TabItem } from "@/common/components/ui/Tabs";
import { Badge } from "@/common/components/ui/Badge";

type TabKey = "profile" | "security" | "preferences";

const TAB_ITEMS: TabItem<TabKey>[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "security", label: "Security", icon: Shield },
  { key: "preferences", label: "Preferences", icon: Palette },
];

type Me = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  emailVerifiedAt?: string | null;
};

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [tab, setTab] = useState<TabKey>("profile");
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const { data: me } = useQuery<Me>({
    queryKey: ["me"],
    queryFn: () => api.get("/users/me"),
    enabled: !!user,
  });

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  useEffect(() => {
    if (me) {
      setProfile({
        firstName: me.firstName || "",
        lastName: me.lastName || "",
        phone: me.phone || "",
      });
    }
  }, [me]);

  const resendVerification = useMutation({
    mutationFn: () => api.post("/auth/email/send-verification", {}),
    onSuccess: () => {
      toast({
        variant: "success",
        title: "Verification email sent",
        description: "Check your inbox for the verification link.",
      });
    },
    onError: (err) => {
      toast({
        variant: "error",
        title: "Couldn't send verification",
        description:
          err instanceof ApiError ? err.message : "Try again shortly.",
      });
    },
  });

  const saveProfile = useMutation({
    mutationFn: () => api.patch("/users/me", profile),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      toast({ variant: "success", title: "Profile updated" });
    },
    onError: (err) => {
      toast({
        variant: "error",
        title: "Couldn't save profile",
        description: err instanceof ApiError ? err.message : undefined,
      });
    },
  });

  const [pw, setPw] = useState({ old: "", next: "", confirm: "" });
  const changePassword = useMutation({
    mutationFn: () =>
      api.post("/users/me/password", {
        oldPassword: pw.old,
        newPassword: pw.next,
      }),
    onSuccess: () => {
      toast({
        variant: "success",
        title: "Password updated",
        description: "Please sign in again next time.",
      });
      setPw({ old: "", next: "", confirm: "" });
    },
    onError: (err) => {
      toast({
        variant: "error",
        title: "Couldn't change password",
        description: err instanceof ApiError ? err.message : undefined,
      });
    },
  });

  const submitChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 8) {
      toast({
        variant: "warning",
        title: "Password too short",
        description: "Minimum 8 characters.",
      });
      return;
    }
    if (pw.next !== pw.confirm) {
      toast({
        variant: "warning",
        title: "Passwords don’t match",
      });
      return;
    }
    changePassword.mutate();
  };

  const requestReset = async () => {
    if (!user) return;
    setSendingReset(true);
    try {
      await api.post("/auth/password/forgot", {
        tenantSlug: TENANT_SLUG,
        email: user.email,
      });
      toast({
        variant: "success",
        title: "Reset link sent",
        description: "Check your inbox for a link to set a new password.",
      });
    } catch (err) {
      toast({
        variant: "error",
        title: "Couldn't send reset link",
        description:
          err instanceof ApiError ? err.message : "Please try again shortly.",
      });
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div>
      <Tabs items={TAB_ITEMS} value={tab} onChange={setTab} className="mb-6" />

      {tab === "profile" && (
        <Card>
          {me && !me.emailVerifiedAt && (
            <div className="px-5 pt-5">
              <div
                role="alert"
                className="flex items-start justify-between gap-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    Verify your email
                  </p>
                  <p className="text-amber-800 dark:text-amber-300 text-xs mt-0.5">
                    We sent a verification link to <strong>{me.email}</strong>.
                    Please confirm to unlock receipts and order updates.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  loading={resendVerification.isPending}
                  onClick={() => resendVerification.mutate()}
                >
                  Resend
                </Button>
              </div>
            </div>
          )}
          <CardHeader>
            <h2 className="text-base font-semibold text-foreground">Profile</h2>
          </CardHeader>
          <CardBody className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                {(me?.firstName || user?.firstName || "U")[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  {me?.firstName} {me?.lastName}
                </p>
                <p className="text-sm text-muted">{me?.email}</p>
                <div className="mt-1">
                  <Badge tone="accent">
                    {role ? ROLE_LABELS[role] : "Guest"}
                  </Badge>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveProfile.mutate();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First name"
                  required
                  value={profile.firstName}
                  onChange={(e) =>
                    setProfile({ ...profile, firstName: e.target.value })
                  }
                />
                <Input
                  label="Last name"
                  value={profile.lastName}
                  onChange={(e) =>
                    setProfile({ ...profile, lastName: e.target.value })
                  }
                />
              </div>
              <Input
                label="Phone"
                inputMode="tel"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                placeholder="+91 …"
              />
              <div>
                <Input
                  label="Email"
                  value={me?.email || ""}
                  disabled
                  leftIcon={<Mail className="h-4 w-4" />}
                  hint="Email cannot be changed. Contact support if needed."
                />
                {me?.emailVerifiedAt ? (
                  <p className="mt-2 text-xs inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    Not verified yet
                  </p>
                )}
              </div>
              <div className="pt-2">
                <Button
                  type="submit"
                  loading={saveProfile.isPending}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Save changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {tab === "security" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-accent" />
              <h2 className="text-base font-semibold text-foreground">
                Change password
              </h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={submitChangePassword} className="space-y-4">
                <Input
                  label="Current password"
                  type="password"
                  required
                  autoComplete="current-password"
                  leftIcon={<Lock className="h-4 w-4" />}
                  value={pw.old}
                  onChange={(e) => setPw({ ...pw, old: e.target.value })}
                />
                <Input
                  label="New password"
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={8}
                  hint="At least 8 characters"
                  leftIcon={<Lock className="h-4 w-4" />}
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  required
                  autoComplete="new-password"
                  leftIcon={<KeyRound className="h-4 w-4" />}
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                />
                <div>
                  <Button type="submit" loading={changePassword.isPending}>
                    Update password
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Forgot your current password?
              </h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <p className="text-sm text-muted">
                We&apos;ll email you a secure link to set a new password.
              </p>
              <Button
                variant="outline"
                leftIcon={<Mail className="h-4 w-4" />}
                loading={sendingReset}
                onClick={requestReset}
              >
                Email me a reset link
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-foreground">
                Session
              </h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <p className="text-sm text-muted">
                Signed in as <strong>{user?.email}</strong>.
              </p>
              <Button
                variant="outline"
                leftIcon={<LogOut className="h-4 w-4" />}
                onClick={() => logout()}
              >
                Log out
              </Button>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "preferences" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
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
                      Switches the interface theme
                    </p>
                  </div>
                </div>
                <Switch checked={theme === "dark"} onChange={toggleTheme} />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-accent" />
              <h2 className="text-base font-semibold text-foreground">
                Email notifications
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Order updates
                  </p>
                  <p className="text-xs text-muted">
                    Shipping confirmations, delivery status, cancellations
                  </p>
                </div>
                <Switch checked={orderUpdates} onChange={setOrderUpdates} />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Promotions
                  </p>
                  <p className="text-xs text-muted">
                    Deals, coupon codes, new arrivals
                  </p>
                </div>
                <Switch
                  checked={marketingEmails}
                  onChange={setMarketingEmails}
                />
              </div>
              <p className="text-xs text-muted pt-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-muted" />
                Preferences saved locally in this browser.
              </p>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
