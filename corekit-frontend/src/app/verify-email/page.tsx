"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MailCheck, XCircle } from "lucide-react";
import { api, ApiError } from "@/platform/api/client";
import { Button } from "@/common/components/ui/Button";
import { Card, CardBody } from "@/common/components/ui/Card";
import { Spinner } from "@/common/components/ui/States";

function VerifyContent() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<"idle" | "verifying" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Missing or invalid verification token.");
      return;
    }
    setState("verifying");
    api
      .post("/auth/email/verify", { token })
      .then(() => {
        setState("done");
        setMessage(null);
      })
      .catch((err) => {
        setState("error");
        setMessage(
          err instanceof ApiError
            ? err.message
            : "Verification failed — please request a new link.",
        );
      });
  }, [token]);

  return (
    <div className="max-w-md mx-auto py-10">
      <Card>
        <CardBody className="text-center">
          {state === "verifying" && (
            <>
              <Spinner className="mx-auto h-7 w-7" />
              <h1 className="mt-4 text-xl font-bold text-foreground">
                Verifying your email…
              </h1>
            </>
          )}
          {state === "done" && (
            <>
              <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="mt-4 text-xl font-bold text-foreground">
                Email verified
              </h1>
              <p className="mt-2 text-sm text-muted">
                Thanks! Your email address is now verified.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="/account"
                  className="inline-flex h-10 px-4 items-center rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90"
                >
                  Back to account
                </Link>
                <Link
                  href="/products"
                  className="inline-flex h-10 px-4 items-center rounded-lg border border-card-border bg-card-bg text-sm font-semibold text-foreground hover:bg-card-border/30"
                >
                  Continue shopping
                </Link>
              </div>
            </>
          )}
          {state === "error" && (
            <>
              <div className="mx-auto h-14 w-14 rounded-full bg-danger/15 text-danger flex items-center justify-center">
                <XCircle className="h-7 w-7" />
              </div>
              <h1 className="mt-4 text-xl font-bold text-foreground">
                Couldn&apos;t verify your email
              </h1>
              <p className="mt-2 text-sm text-muted">{message}</p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="/account"
                  className="inline-flex h-10 px-4 items-center rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90"
                >
                  Go to account
                </Link>
              </div>
            </>
          )}
          {state === "idle" && (
            <>
              <MailCheck className="mx-auto h-8 w-8 text-muted" />
              <p className="mt-3 text-sm text-muted">
                Preparing verification…
              </p>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
