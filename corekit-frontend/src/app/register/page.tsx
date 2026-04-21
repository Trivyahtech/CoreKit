"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import { api, ApiError, TENANT_SLUG } from "@/platform/api/client";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { Button } from "@/common/components/ui/Button";
import { Input } from "@/common/components/ui/Input";
import { Card, CardBody } from "@/common/components/ui/Card";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    tenantSlug: TENANT_SLUG,
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/register", form);
      login(res.accessToken, res.user);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = Array.isArray(err.data?.message)
          ? err.data.message.join(", ")
          : err.message;
        setError(msg);
      } else {
        setError("Unable to sign up. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-muted">
          It only takes a minute — start shopping right away
        </p>
      </div>

      <Card>
        <CardBody>
          {error && (
            <div
              className="mb-4 bg-danger/10 text-danger px-3 py-2 rounded-lg text-sm"
              role="alert"
            >
              {error}
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                required
                autoComplete="given-name"
                leftIcon={<UserIcon className="h-4 w-4" />}
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
              />
              <Input
                label="Last name"
                required
                autoComplete="family-name"
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
              />
            </div>
            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              leftIcon={<Mail className="h-4 w-4" />}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              hint="At least 8 characters"
              leftIcon={<Lock className="h-4 w-4" />}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Create account
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-accent hover:text-accent/80"
            >
              Sign in
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
