"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ProtectedRoute } from "@/components/shell";
import { Card, ErrorState, LoadingBlock, SectionTitle, StatCard } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { DashboardOverview, Incident } from "@/lib/types";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ff5470",
  high: "#f5b942",
  medium: "#4fa9ff",
  low: "#3ddc97",
};

function AnalyticsContent() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([api.incidents(), api.overview()])
      .then(([inc, ov]) => {
        if (!alive) return;
        setIncidents(inc);
        setOverview(ov);
      })
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Failed to load analytics."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    incidents.forEach((i) => map.set(i.category, (map.get(i.category) || 0) + i.complaints));
    return Array.from(map.entries()).map(([category, complaints]) => ({ category, complaints }));
  }, [incidents]);

  const bySeverity = useMemo(() => {
    const map = new Map<string, number>();
    incidents.forEach((i) => map.set(i.severity, (map.get(i.severity) || 0) + 1));
    return Array.from(map.entries()).map(([severity, value]) => ({ severity, value }));
  }, [incidents]);

  const byDepartment = useMemo(() => {
    const map = new Map<string, number>();
    incidents.forEach((i) => map.set(i.department, (map.get(i.department) || 0) + i.affected));
    return Array.from(map.entries()).map(([department, affected]) => ({ department, affected }));
  }, [incidents]);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <SectionTitle title="Analytics" subtitle="Trends across complaints, severity, and department workload" />

      {overview && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Resolution Rate" value={`${overview.resolution_rate}%`} tone="accent" />
          <StatCard label="Total Complaints" value={overview.total_complaints} />
          <StatCard label="Active Incidents" value={overview.active_incidents} />
          <StatCard label="SLA Breaches" value={overview.sla_breaches} tone="warn" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <SectionTitle title="Complaints by Category" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1b2333" />
              <XAxis dataKey="category" stroke="#8a97ad" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis stroke="#8a97ad" fontSize={11} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #2a3448", borderRadius: 8 }} />
              <Bar dataKey="complaints" fill="#3ddc97" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle title="Incidents by Severity" />
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={bySeverity} dataKey="value" nameKey="severity" innerRadius={60} outerRadius={95} paddingAngle={3}>
                {bySeverity.map((entry) => (
                  <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity] || "#3d4a63"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #2a3448", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
            {bySeverity.map((e) => (
              <div key={e.severity} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: SEVERITY_COLORS[e.severity] || "#3d4a63" }} />
                <span className="capitalize text-base-500">
                  {e.severity} ({e.value})
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <SectionTitle title="Citizens Affected by Department" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byDepartment} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1b2333" />
              <XAxis type="number" stroke="#8a97ad" fontSize={11} />
              <YAxis type="category" dataKey="department" stroke="#8a97ad" fontSize={11} width={140} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #2a3448", borderRadius: 8 }} />
              <Bar dataKey="affected" fill="#4fa9ff" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute roles={["admin", "department_officer"]}>
      <AnalyticsContent />
    </ProtectedRoute>
  );
}
