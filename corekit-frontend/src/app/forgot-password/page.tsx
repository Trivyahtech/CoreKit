"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, MailCheck } from "lucide-react";
import { api, ApiError, TENANT_SLUG } from "@/platform/api/client";
import { Button } from "@/common/components/ui/Button";
import { Input } from "@/common/components/ui/Input";
import { Card, CardBody } from "@/common/components/ui/Card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/password/forgot", {
        tenantSlug: TENANT_SLUG,
        email: email.trim(),
      });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not send reset link.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-muted">
          We&apos;ll email you a link to set a new one.
        </p>
      </div>
      <Card>
        <CardBody>
          {sent ? (
            <div className="text-center py-4">
              <div className="mx-auto h-14 w-14 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                <MailCheck className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-foreground">
                Check your email
              </h2>
              <p className="mt-2 text-sm text-muted">
                If an account exists for <strong>{email}</strong>, a reset
                link will arrive shortly. The link expires in 30 minutes.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center text-sm font-semibold text-accent hover:text-accent/80"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to sign in
              </Link>
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
                label="Email"
                type="email"
                required
                autoComplete="email"
                leftIcon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={loading}
              >
                Send reset link
              </Button>
              <p className="text-center text-sm text-muted">
                Remembered it?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-accent hover:text-accent/80"
                >
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
