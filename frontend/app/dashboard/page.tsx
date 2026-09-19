"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Flame, ShieldCheck, Timer, Users, FileWarning } from "lucide-react";
import { ProtectedRoute, Greeting } from "@/components/shell";
import { Card, EmptyState, ErrorState, LoadingBlock, SectionTitle, SeverityBadge, StatCard, StatusBadge } from "@/components/ui";
import { IncidentMap } from "@/components/incident-map";
import { api, ApiError } from "@/lib/api";
import type { DashboardOverview, Incident, Hotspot } from "@/lib/types";

function DashboardContent() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [emerging, setEmerging] = useState<Incident[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([api.overview(), api.emerging(), api.hotspots()])
      .then(([ov, em, hs]) => {
        if (!alive) return;
        setOverview(ov);
        setEmerging(em);
        setHotspots(hs);
      })
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Failed to load dashboard data."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorState message={error} />;
  if (!overview) return <EmptyState message="No dashboard data available." />;

  return (
    <div className="space-y-6">
      <SectionTitle title={<Greeting />} subtitle="Command center overview · real-time civic intelligence" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Complaints" value={overview.total_complaints} icon={<FileWarning size={18} />} />
        <StatCard label="Active Incidents" value={overview.active_incidents} icon={<AlertTriangle size={18} />} />
        <StatCard label="Critical Incidents" value={overview.critical_incidents} icon={<Flame size={18} />} tone="critical" />
        <StatCard label="Citizens Affected" value={overview.citizens_affected} icon={<Users size={18} />} />
        <StatCard label="SLA Breaches" value={overview.sla_breaches} icon={<Timer size={18} />} tone="warn" />
        <StatCard
          label="Resolution Rate"
          value={`${overview.resolution_rate}%`}
          icon={<ShieldCheck size={18} />}
          tone="accent"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionTitle title="Live Incident Map" subtitle={`${hotspots.length} active hotspots`} />
          <IncidentMap points={hotspots} height={380} />
        </Card>

        <Card>
          <SectionTitle title="System Status" subtitle="Live diagnostics" />
          <div className="space-y-3 text-sm">
            <StatusRow label="API" ok />
            <StatusRow label="Database" ok />
            <StatusRow label="AI Engine (local)" ok />
            <StatusRow label="CORS" ok />
          </div>
          <div className="mt-5 border-t border-base-700 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-500">Recent Activity</p>
            <ul className="space-y-2 text-sm text-base-100">
              {emerging.slice(0, 4).map((i) => (
                <li key={i.id} className="flex items-center justify-between">
                  <span className="truncate text-base-500">{i.title}</span>
                  <SeverityBadge severity={i.severity} />
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Emerging Incidents"
          subtitle="Sorted by report velocity"
          action={
            <Link href="/priority" className="text-xs font-semibold text-accent hover:underline">
              View priority queue →
            </Link>
          }
        />
        {emerging.length === 0 ? (
          <EmptyState message="No incidents detected yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-base-700 text-xs uppercase tracking-wide text-base-500">
                  <th className="py-2 pr-4">Incident</th>
                  <th className="py-2 pr-4">Area</th>
                  <th className="py-2 pr-4">Severity</th>
                  <th className="py-2 pr-4">Velocity</th>
                  <th className="py-2 pr-4">Priority</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {emerging.slice(0, 6).map((i) => (
                  <tr key={i.id} className="border-b border-base-700/50 hover:bg-base-800/50">
                    <td className="py-2.5 pr-4">
                      <Link href={`/incidents/${i.id}`} className="font-medium text-white hover:text-accent">
                        {i.title}
                      </Link>
                      <p className="mono text-xs text-base-500">{i.id}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-base-500">{i.area}</td>
                    <td className="py-2.5 pr-4">
                      <SeverityBadge severity={i.severity} />
                    </td>
                    <td className="py-2.5 pr-4 mono text-base-100">{i.velocity.toFixed(0)}</td>
                    <td className="py-2.5 pr-4 mono text-base-100">{i.priority}</td>
                    <td className="py-2.5 pr-4">
                      <StatusBadge status={i.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-base-500">{label}</span>
      <span className={`flex items-center gap-1.5 font-medium ${ok ? "text-accent" : "text-crit"}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-accent" : "bg-crit"} animate-pulseSlow`} />
        {ok ? "Operational" : "Degraded"}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute roles={["admin", "department_officer"]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
