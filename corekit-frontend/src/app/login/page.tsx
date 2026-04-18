"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { api, ApiError } from "@/platform/api/client";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [method, setMethod] = useState<"PASSWORD" | "OTP">("PASSWORD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  const [formData, setFormData] = useState({
    tenantSlug: "corekit",
    email: "",
    password: "",
    otp: "",
  });

  const handleRoleRedirect = (role: string) => {
    if (role === "ADMIN" || role === "STAFF") {
      router.push("/admin");
    } else if (role === "VENDOR") {
      router.push("/vendor");
    } else {
      router.push("/");
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/login", {
        tenantSlug: formData.tenantSlug,
        email: formData.email,
        password: formData.password,
      });
      login(response.accessToken, response.user);
      handleRoleRedirect(response.user.role);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      setError("Please enter your email first");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/otp/send", {
        tenantSlug: formData.tenantSlug,
        email: formData.email,
      });
      setOtpSent(true);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/otp/verify", {
        tenantSlug: formData.tenantSlug,
        email: formData.email,
        otp: formData.otp,
      });
      login(response.accessToken, response.user);
      handleRoleRedirect(response.user.role);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:6767/api/v1"}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-card-bg p-8 rounded-2xl shadow-xl border border-card-border">
        <div>
          <div className="flex justify-center mb-4">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
              CoreKit
            </span>
          </div>
          <h2 className="text-center text-2xl font-bold text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted">
            Or{" "}
            <Link href="/register" className="font-medium text-accent hover:text-accent/80 transition-colors">
              create a new account
            </Link>
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-background p-1 rounded-lg border border-card-border">
          <button
            onClick={() => { setMethod("PASSWORD"); setOtpSent(false); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${method === "PASSWORD" ? "bg-card-bg shadow text-foreground" : "text-muted hover:text-foreground"}`}
          >
            Password
          </button>
          <button
            onClick={() => setMethod("OTP")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${method === "OTP" ? "bg-card-bg shadow text-foreground" : "text-muted hover:text-foreground"}`}
          >
            Login via OTP
          </button>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {method === "PASSWORD" ? (
          <form className="space-y-5" onSubmit={handlePasswordLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email address</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2.5 bg-background border border-card-border rounded-lg text-foreground placeholder-muted text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-colors"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2.5 bg-background border border-card-border rounded-lg text-foreground placeholder-muted text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-colors"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-accent hover:bg-accent/90 disabled:opacity-70 transition-all shadow"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Sign in"}
            </button>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={otpSent ? handleVerifyOtp : (e) => { e.preventDefault(); handleSendOtp(); }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email address</label>
                <input
                  type="email"
                  required
                  disabled={otpSent}
                  className="w-full px-3 py-2.5 bg-background border border-card-border rounded-lg text-foreground placeholder-muted text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-colors disabled:opacity-50"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              {otpSent && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">6-Digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    className="w-full px-3 py-2.5 bg-background border border-card-border rounded-lg text-foreground text-center text-xl font-mono tracking-widest focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-colors"
                    value={formData.otp}
                    onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                  />
                  <p className="mt-2 text-xs text-center text-muted">
                    Check your email for the OTP code. Wait 5 minutes to request another.
                  </p>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-accent hover:bg-accent/90 disabled:opacity-70 transition-all shadow"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : otpSent ? "Verify & Login" : "Send OTP code"}
            </button>
          </form>
        )}

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-card-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card-bg text-muted">Or continue with</span>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex justify-center py-2.5 px-4 border border-card-border rounded-lg shadow-sm bg-card-bg text-sm font-medium text-foreground hover:bg-card-border/30 transition-all"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
