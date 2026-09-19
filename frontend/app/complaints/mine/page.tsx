"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/shell";
import { Card, EmptyState, ErrorState, LoadingBlock, SectionTitle, StatusBadge } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { Complaint } from "@/lib/types";

function MyComplaintsContent() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .myComplaints()
      .then((data) => alive && setComplaints(data))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Failed to load your complaints."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <SectionTitle title="My Complaints" subtitle="Track the status of everything you've reported" />
      <Card>
        {complaints.length === 0 ? (
          <EmptyState message="You haven't submitted any complaints yet." />
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <Link
                key={c.id}
                href={`/complaints/${c.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-base-700 bg-base-800/40 p-4 transition hover:border-accent/30 hover:bg-base-800"
              >
                <div className="min-w-0">
                  <p className="mono text-xs text-base-500">{c.id}</p>
                  <p className="mt-0.5 truncate text-sm text-white">{c.description}</p>
                  <p className="mt-0.5 text-xs text-base-500">
                    {c.category} · {new Date(c.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function MyComplaintsPage() {
  return (
    <ProtectedRoute roles={["citizen"]}>
      <MyComplaintsContent />
    </ProtectedRoute>
  );
}
