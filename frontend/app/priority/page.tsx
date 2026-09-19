"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/shell";
import { Card, EmptyState, ErrorState, LoadingBlock, SectionTitle, SeverityBadge, StatusBadge } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { Incident } from "@/lib/types";

function PriorityContent() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .emerging()
      .then((data) => alive && setIncidents(data))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Failed to load priority queue."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorState message={error} />;

  const ranked = [...incidents].sort((a, b) => b.priority - a.priority);

  return (
    <div className="space-y-6">
      <SectionTitle title="Priority Queue" subtitle="Incidents ranked by AI priority score for dispatch decisions" />
      <Card>
        {ranked.length === 0 ? (
          <EmptyState message="Queue is empty." />
        ) : (
          <div className="space-y-3">
            {ranked.map((i, idx) => (
              <Link
                key={i.id}
                href={`/incidents/${i.id}`}
                className="flex items-center gap-4 rounded-lg border border-base-700 bg-base-800/40 p-4 transition hover:border-accent/30 hover:bg-base-800"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-base-700 mono text-sm font-bold text-base-100">
                  #{idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-white">{i.title}</p>
                    <SeverityBadge severity={i.severity} />
                  </div>
                  <p className="mt-0.5 text-xs text-base-500">
                    {i.id} · {i.area} · {i.department}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="mono text-lg font-bold text-accent">{i.priority}</p>
                  <p className="text-xs text-base-500">priority score</p>
                </div>
                <StatusBadge status={i.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function PriorityPage() {
  return (
    <ProtectedRoute roles={["admin", "department_officer"]}>
      <PriorityContent />
    </ProtectedRoute>
  );
}
