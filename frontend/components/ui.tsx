"use client";

import clsx from "clsx";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("card-surface rounded-xl p-5", className)}>{children}</div>;
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-base-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const severityColors: Record<string, string> = {
  critical: "bg-crit/15 text-crit border-crit/30",
  high: "bg-warn/15 text-warn border-warn/30",
  medium: "bg-info/15 text-info border-info/30",
  low: "bg-accent/15 text-accent border-accent/30",
};

export function SeverityBadge({ severity }: { severity: string }) {
  const cls = severityColors[severity?.toLowerCase()] || "bg-base-600/30 text-base-500 border-base-600";
  return (
    <span className={clsx("rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide", cls)}>
      {severity}
    </span>
  );
}

const statusColors: Record<string, string> = {
  resolved: "bg-accent/15 text-accent border-accent/30",
  verified: "bg-accent/15 text-accent border-accent/30",
  under_investigation: "bg-warn/15 text-warn border-warn/30",
  reopened: "bg-crit/15 text-crit border-crit/30",
  linked: "bg-info/15 text-info border-info/30",
  analyzed: "bg-info/15 text-info border-info/30",
  created: "bg-info/15 text-info border-info/30",
  in_progress: "bg-warn/15 text-warn border-warn/30",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = statusColors[status?.toLowerCase()] || "bg-base-600/30 text-base-500 border-base-600";
  return (
    <span className={clsx("rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", cls)}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "critical" | "accent" | "warn";
  hint?: string;
}) {
  const toneCls: Record<string, string> = {
    default: "text-white",
    critical: "text-crit",
    accent: "text-accent",
    warn: "text-warn",
  };
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-base-500">{label}</p>
        {icon && <div className="text-base-500">{icon}</div>}
      </div>
      <p className={clsx("mono mt-2 text-3xl font-bold", toneCls[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-base-500">{hint}</p>}
    </Card>
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const variants: Record<string, string> = {
    primary: "bg-accent text-base-950 hover:bg-accent-glow shadow-glow font-semibold",
    ghost: "bg-base-800 text-base-100 hover:bg-base-700 border border-base-600",
    danger: "bg-crit/15 text-crit border border-crit/30 hover:bg-crit/25",
  };
  return (
    <button
      className={clsx(
        "rounded-lg px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="rounded-lg border border-dashed border-base-600 p-8 text-center text-sm text-base-500">{message}</div>;
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-crit/30 bg-crit/10 p-4 text-sm text-crit">{message}</div>
  );
}

export function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="mono text-xs tracking-widest text-base-500">LOADING…</div>
    </div>
  );
}
