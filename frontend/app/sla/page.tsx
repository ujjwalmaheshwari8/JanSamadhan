"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertOctagon, CheckCircle2, Timer } from "lucide-react";
import { ProtectedRoute } from "@/components/shell";
import { Card, EmptyState, ErrorState, LoadingBlock, SectionTitle, SeverityBadge, StatCard } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { Incident } from "@/lib/types";

function timeRemaining(deadline: string) {
  const diffMs = new Date(deadline).getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const hours = Math.floor(abs / 3600000);
  const mins = Math.floor((abs % 3600000) / 60000);
  const label = `${hours}h ${mins}m`;
  return diffMs < 0 ? `Overdue by ${label}` : `${label} remaining`;
}

function SLAContent() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .incidents()
      .then((data) => alive && setIncidents(data))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Failed to load SLA data."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorState message={error} />;

  const breached = incidents.filter((i) => i.sla_breached);
  const onTrack = incidents.filter((i) => !i.sla_breached);
  const sorted = [...incidents].sort((a, b) => new Date(a.sla_deadline).getTime() - new Date(b.sla_deadline).getTime());

  return (
    <div className="space-y-6">
      <SectionTitle title="SLA Monitor" subtitle="Service-level commitments across all active incidents" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="SLA Breached" value={breached.length} icon={<AlertOctagon size={18} />} tone="critical" />
        <StatCard label="On Track" value={onTrack.length} icon={<CheckCircle2 size={18} />} tone="accent" />
        <StatCard label="Total Tracked" value={incidents.length} icon={<Timer size={18} />} />
      </div>

      <Card>
        {sorted.length === 0 ? (
          <EmptyState message="No SLA data available." />
        ) : (
          <div className="space-y-3">
            {sorted.map((i) => (
              <Link
                key={i.id}
                href={`/incidents/${i.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-base-700 bg-base-800/40 p-4 transition hover:bg-base-800"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-white">{i.title}</p>
                    <SeverityBadge severity={i.severity} />
                  </div>
                  <p className="mt-0.5 text-xs text-base-500">
                    {i.id} · {i.department}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`mono text-sm font-bold ${i.sla_breached ? "text-crit" : "text-accent"}`}>
                    {timeRemaining(i.sla_deadline)}
                  </p>
                  <p className="text-xs text-base-500">{new Date(i.sla_deadline).toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function SLAPage() {
  return (
    <ProtectedRoute roles={["admin", "department_officer"]}>
      <SLAContent />
    </ProtectedRoute>
  );
}
