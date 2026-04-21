"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, KeyRound } from "lucide-react";
import { api, ApiError, TENANT_SLUG } from "@/platform/api/client";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { Button } from "@/common/components/ui/Button";
import { Input } from "@/common/components/ui/Input";
import { Card, CardBody } from "@/common/components/ui/Card";
import { cn } from "@/common/utils/cn";

function LoginContent() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/";
  const { login } = useAuth();

  const [method, setMethod] = useState<"PASSWORD" | "OTP">("PASSWORD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [form, setForm] = useState({
    tenantSlug: TENANT_SLUG,
    email: "",
    password: "",
    otp: "",
  });

  const redirect = (role: string) => {
    // SOP §3.2: D2C single-vendor — only ADMIN/STAFF route to admin panel
    if (role === "ADMIN" || role === "STAFF" || role === "SUPERADMIN") {
      router.push("/admin");
    } else {
      router.push(next);
    }
  };

  const onPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/login", {
        tenantSlug: form.tenantSlug,
        email: form.email,
        password: form.password,
      });
      login(res.accessToken, res.user);
      redirect(res.user.role);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    if (!form.email) {
      setError("Please enter your email first");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/otp/send", {
        tenantSlug: form.tenantSlug,
        email: form.email,
      });
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/otp/verify", {
        tenantSlug: form.tenantSlug,
        email: form.email,
        otp: form.otp,
      });
      login(res.accessToken, res.user);
      redirect(res.user.role);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Invalid or expired OTP.",
      );
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = () => {
    window.location.href =
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:6767/api/v1"}/auth/google`;
  };

  const onDevAdmin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/login", {
        tenantSlug: TENANT_SLUG,
        email: "admin@corekit.dev",
        password: "Admin@123",
      });
      login(res.accessToken, res.user);
      redirect(res.user.role);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Dev admin login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-muted">
          Sign in to continue shopping
        </p>
      </div>

      <Card>
        <CardBody>
          <div className="flex bg-background p-1 rounded-lg border border-card-border mb-5">
            <button
              type="button"
              onClick={() => {
                setMethod("PASSWORD");
                setOtpSent(false);
                setError(null);
              }}
              className={cn(
                "flex-1 py-2 text-sm font-semibold rounded-md transition-colors",
                method === "PASSWORD"
                  ? "bg-card-bg shadow-sm text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod("OTP");
                setError(null);
              }}
              className={cn(
                "flex-1 py-2 text-sm font-semibold rounded-md transition-colors",
                method === "OTP"
                  ? "bg-card-bg shadow-sm text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              Email OTP
            </button>
          </div>

          {error && (
            <div
              className="mb-4 bg-danger/10 text-danger px-3 py-2 rounded-lg text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          {method === "PASSWORD" ? (
            <form onSubmit={onPassword} className="space-y-4">
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
                autoComplete="current-password"
                leftIcon={<Lock className="h-4 w-4" />}
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
              />
              <div className="flex justify-end -mt-2">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-accent hover:text-accent/80"
                >
                  Forgot your password?
                </Link>
              </div>
              <Button type="submit" fullWidth loading={loading} size="lg">
                Sign in
              </Button>
            </form>
          ) : (
            <form
              onSubmit={
                otpSent
                  ? verifyOtp
                  : (e) => {
                      e.preventDefault();
                      sendOtp();
                    }
              }
              className="space-y-4"
            >
              <Input
                label="Email"
                type="email"
                required
                disabled={otpSent}
                autoComplete="email"
                leftIcon={<Mail className="h-4 w-4" />}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {otpSent && (
                <Input
                  label="6-digit code"
                  required
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  autoComplete="one-time-code"
                  hint="Check your email for the verification code"
                  leftIcon={<KeyRound className="h-4 w-4" />}
                  className="text-center font-mono tracking-widest"
                  value={form.otp}
                  onChange={(e) => setForm({ ...form, otp: e.target.value })}
                />
              )}
              <Button type="submit" fullWidth loading={loading} size="lg">
                {otpSent ? "Verify & sign in" : "Send code"}
              </Button>
            </form>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-card-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-card-bg text-muted">
                or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            fullWidth
            size="lg"
            onClick={onGoogle}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>

          <p className="mt-5 text-center text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-accent hover:text-accent/80"
            >
              Create one
            </Link>
          </p>

          {process.env.NODE_ENV !== "production" && (
            <div className="mt-6 pt-4 border-t border-dashed border-amber-300 dark:border-amber-700/60">
              <p className="text-[10px] uppercase tracking-widest font-bold text-amber-600 dark:text-amber-400 text-center mb-2">
                Dev only · removed in production
              </p>
              <Button
                type="button"
                variant="outline"
                fullWidth
                loading={loading}
                onClick={onDevAdmin}
                className="border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                Log in as admin (dev)
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
