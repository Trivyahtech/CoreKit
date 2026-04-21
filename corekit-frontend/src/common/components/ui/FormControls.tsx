"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/common/utils/cn";

type FieldShell = {
  label?: string;
  hint?: string;
  error?: string;
  id?: string;
  children: React.ReactNode;
};

function Field({ label, hint, error, id, children }: FieldShell) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, ...rest },
  ref,
) {
  const sid = id || rest.name;
  return (
    <Field label={label} hint={hint} error={error} id={sid}>
      <div className="relative">
        <select
          ref={ref}
          id={sid}
          className={cn(
            "w-full h-10 appearance-none rounded-lg border border-card-border bg-card-bg pl-3 pr-9 text-sm text-foreground",
            "outline-none transition-colors",
            "focus:border-accent focus:ring-2 focus:ring-accent/25",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            error && "border-danger focus:border-danger focus:ring-danger/25",
            className,
          )}
          {...rest}
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
      </div>
    </Field>
  );
});

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, hint, error, className, id, rows = 4, ...rest }, ref) {
    const tid = id || rest.name;
    return (
      <Field label={label} hint={hint} error={error} id={tid}>
        <textarea
          ref={ref}
          id={tid}
          rows={rows}
          className={cn(
            "w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground",
            "placeholder:text-muted/70 outline-none transition-colors resize-y",
            "focus:border-accent focus:ring-2 focus:ring-accent/25",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            error && "border-danger focus:border-danger focus:ring-danger/25",
            className,
          )}
          {...rest}
        />
      </Field>
    );
  },
);

type SwitchProps = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
};

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 cursor-pointer select-none",
        disabled && "opacity-60 cursor-not-allowed",
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 mt-0.5 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent focus-visible:ring-offset-background",
          checked ? "bg-accent" : "bg-card-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
      {(label || description) && (
        <div className="text-sm">
          {label && <p className="font-medium text-foreground">{label}</p>}
          {description && (
            <p className="text-xs text-muted mt-0.5">{description}</p>
          )}
        </div>
      )}
    </label>
  );
}

export function Checkbox({
  label,
  description,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  description?: string;
}) {
  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <input
        type="checkbox"
        className={cn(
          "h-4 w-4 mt-0.5 rounded border-card-border text-accent focus:ring-accent/30",
          className,
        )}
        {...rest}
      />
      {(label || description) && (
        <span className="text-sm">
          {label && <span className="font-medium text-foreground">{label}</span>}
          {description && (
            <span className="block text-xs text-muted">{description}</span>
          )}
        </span>
      )}
    </label>
  );
}
