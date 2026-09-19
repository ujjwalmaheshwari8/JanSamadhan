"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brain } from "lucide-react";
import { ProtectedRoute } from "@/components/shell";
import { Card, EmptyState, ErrorState, LoadingBlock, SectionTitle, SeverityBadge } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { Incident } from "@/lib/types";

function RootCauseContent() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .incidents()
      .then((data) => alive && setIncidents(data))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Failed to load root cause data."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <SectionTitle title="Root Cause Intelligence" subtitle="AI-derived causal analysis behind each active incident cluster" />
      {incidents.length === 0 ? (
        <EmptyState message="No incident intelligence available yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {incidents.map((i) => (
            <Card key={i.id}>
              <div className="mb-2 flex items-center justify-between">
                <p className="mono text-xs text-base-500">{i.id}</p>
                <SeverityBadge severity={i.severity} />
              </div>
              <Link href={`/incidents/${i.id}`} className="font-semibold text-white hover:text-accent">
                {i.title}
              </Link>
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-base-700 bg-base-800/50 p-3">
                <Brain size={16} className="mt-0.5 shrink-0 text-accent" />
                <p className="text-sm text-base-100">{i.root_cause}</p>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-base-500">
                <span>Confidence</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-base-700">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${i.confidence}%` }} />
                  </div>
                  <span className="mono text-white">{i.confidence}%</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RootCausePage() {
  return (
    <ProtectedRoute roles={["admin", "department_officer"]}>
      <RootCauseContent />
    </ProtectedRoute>
  );
}
