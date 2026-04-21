"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Lock, CheckCircle2 } from "lucide-react";
import { api, ApiError } from "@/platform/api/client";
import { Button } from "@/common/components/ui/Button";
import { Input } from "@/common/components/ui/Input";
import { Card, CardBody } from "@/common/components/ui/Card";

function Content() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (pw !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/password/reset", { token, newPassword: pw });
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not reset password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Set a new password
        </h1>
        <p className="mt-1 text-sm text-muted">
          Choose a strong password you haven&apos;t used before.
        </p>
      </div>
      <Card>
        <CardBody>
          {!token ? (
            <div
              role="alert"
              className="bg-danger/10 text-danger px-3 py-3 rounded-lg text-sm"
            >
              Missing or invalid reset link. Please{" "}
              <Link className="underline" href="/forgot-password">
                request a new one
              </Link>
              .
            </div>
          ) : done ? (
            <div className="text-center py-4">
              <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-foreground">
                Password updated
              </h2>
              <p className="mt-1 text-sm text-muted">
                Redirecting to sign in…
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="bg-danger/10 text-danger px-3 py-2 rounded-lg text-sm"
                >
                  {error}
                </div>
              )}
              <Input
                label="New password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                hint="At least 8 characters"
                leftIcon={<Lock className="h-4 w-4" />}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
              <Input
                label="Confirm new password"
                type="password"
                required
                autoComplete="new-password"
                leftIcon={<KeyRound className="h-4 w-4" />}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <Button type="submit" fullWidth size="lg" loading={loading}>
                Update password
              </Button>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
