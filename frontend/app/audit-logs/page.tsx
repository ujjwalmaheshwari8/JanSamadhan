"use client";

import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { ProtectedRoute } from "@/components/shell";
import { Card, EmptyState, ErrorState, LoadingBlock, SectionTitle } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { AuditLog } from "@/lib/types";

function AuditLogsContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .auditLogs()
      .then((data) => alive && setLogs(data))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Failed to load audit logs."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <SectionTitle title="Audit Logs" subtitle="Immutable trail of every action taken across JanSamadhan" />
      <Card>
        {logs.length === 0 ? (
          <EmptyState message="No audit events recorded yet." />
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 rounded-lg border border-base-700 bg-base-800/40 px-4 py-3">
                <ScrollText size={16} className="shrink-0 text-base-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium capitalize text-white">{log.action.replace(/_/g, " ")}</p>
                  <p className="mono text-xs text-base-500">entity: {log.entity_id}</p>
                </div>
                <p className="mono shrink-0 text-xs text-base-500">{new Date(log.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <ProtectedRoute roles={["admin", "department_officer"]}>
      <AuditLogsContent />
    </ProtectedRoute>
  );
}
