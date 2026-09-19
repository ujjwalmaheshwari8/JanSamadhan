"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { ProtectedRoute } from "@/components/shell";
import { Card, EmptyState, ErrorState, LoadingBlock, SectionTitle, SeverityBadge, StatusBadge } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { Incident } from "@/lib/types";

function IncidentsContent() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("all");

  useEffect(() => {
    let alive = true;
    api
      .incidents()
      .then((data) => alive && setIncidents(data))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Failed to load incidents."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return incidents
      .filter((i) => severity === "all" || i.severity === severity)
      .filter(
        (i) =>
          !query ||
          i.title.toLowerCase().includes(query.toLowerCase()) ||
          i.area.toLowerCase().includes(query.toLowerCase()) ||
          i.id.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => b.priority - a.priority);
  }, [incidents, query, severity]);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <SectionTitle title="Incidents" subtitle={`${incidents.length} master incidents tracked across the city`} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-base-600 bg-base-800 px-3 py-2">
          <Search size={16} className="text-base-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search incidents, areas, IDs…"
            className="w-64 bg-transparent text-sm text-white outline-none placeholder:text-base-500"
          />
        </div>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="rounded-lg border border-base-600 bg-base-800 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="all">All severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState message="No incidents match your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-base-700 text-xs uppercase tracking-wide text-base-500">
                  <th className="py-2 pr-4">Incident</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Area</th>
                  <th className="py-2 pr-4">Complaints</th>
                  <th className="py-2 pr-4">Severity</th>
                  <th className="py-2 pr-4">Priority</th>
                  <th className="py-2 pr-4">SLA</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id} className="border-b border-base-700/50 hover:bg-base-800/50">
                    <td className="py-2.5 pr-4">
                      <Link href={`/incidents/${i.id}`} className="font-medium text-white hover:text-accent">
                        {i.title}
                      </Link>
                      <p className="mono text-xs text-base-500">{i.id}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-base-500">{i.category}</td>
                    <td className="py-2.5 pr-4 text-base-500">{i.area}</td>
                    <td className="py-2.5 pr-4 mono text-base-100">{i.complaints}</td>
                    <td className="py-2.5 pr-4">
                      <SeverityBadge severity={i.severity} />
                    </td>
                    <td className="py-2.5 pr-4 mono text-base-100">{i.priority}</td>
                    <td className="py-2.5 pr-4">
                      {i.sla_breached ? (
                        <span className="text-xs font-semibold text-crit">Breached</span>
                      ) : (
                        <span className="text-xs text-base-500">On track</span>
                      )}
                    </td>
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

export default function IncidentsPage() {
  return (
    <ProtectedRoute roles={["admin", "department_officer", "field_officer"]}>
      <IncidentsContent />
    </ProtectedRoute>
  );
}
