"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Brain, MapPin, Timer, Users, Wrench } from "lucide-react";
import { ProtectedRoute } from "@/components/shell";
import { Button, Card, EmptyState, ErrorState, LoadingBlock, SectionTitle, SeverityBadge, StatusBadge } from "@/components/ui";
import { IncidentMap } from "@/components/incident-map";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Complaint, Incident } from "@/lib/types";

function IncidentDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState("Field inspection");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.all([api.incident(params.id), api.relatedComplaints(params.id)])
      .then(([inc, rel]) => {
        setIncident(inc);
        setComplaints(rel);
        setError(null);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load incident."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleCreateWorkOrder() {
    setCreating(true);
    setCreateMsg(null);
    try {
      const wo = await api.createWorkOrder({ incident_id: params.id, action });
      setCreateMsg(`Work order ${wo.id} created.`);
    } catch (e) {
      setCreateMsg(e instanceof ApiError ? e.message : "Failed to create work order.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorState message={error} />;
  if (!incident) return <EmptyState message="Incident not found." />;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/incidents")}
        className="flex items-center gap-1.5 text-sm text-base-500 hover:text-accent"
      >
        <ArrowLeft size={16} /> Back to incidents
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mono text-xs text-base-500">{incident.id}</p>
          <h1 className="text-2xl font-bold text-white">{incident.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
            {incident.sla_breached && (
              <span className="rounded-full border border-crit/30 bg-crit/15 px-2.5 py-0.5 text-xs font-semibold text-crit">
                SLA BREACHED
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-base-500">Complaints</p>
          <p className="mono mt-1 text-2xl font-bold text-white">{incident.complaints}</p>
        </Card>
        <Card>
          <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-base-500">
            <Users size={12} /> Affected
          </p>
          <p className="mono mt-1 text-2xl font-bold text-white">{incident.affected}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-base-500">Priority</p>
          <p className="mono mt-1 text-2xl font-bold text-accent">{incident.priority}</p>
        </Card>
        <Card>
          <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-base-500">
            <Timer size={12} /> SLA Deadline
          </p>
          <p className="mono mt-1 text-sm font-bold text-white">{new Date(incident.sla_deadline).toLocaleString()}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionTitle title="Location" subtitle={incident.area} />
          <IncidentMap points={[incident]} height={280} />
        </Card>

        <Card>
          <SectionTitle
            title="Root Cause Intelligence"
            subtitle={
              <span className="flex items-center gap-1">
                <Brain size={12} /> AI confidence {incident.confidence}%
              </span>
            }
          />
          <p className="text-sm leading-relaxed text-base-100">{incident.root_cause}</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-base-500">Department</span>
              <span className="text-white">{incident.department}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base-500">Category</span>
              <span className="text-white">{incident.category}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base-500">Report velocity</span>
              <span className="mono text-white">{incident.velocity.toFixed(0)}/hr</span>
            </div>
          </div>
        </Card>
      </div>

      {(user?.role === "admin" || user?.role === "department_officer") && (
        <Card>
          <SectionTitle title="Create Work Order" subtitle="Route this incident to a field crew" />
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Action to take"
              className="w-72 rounded-lg border border-base-600 bg-base-800 px-3 py-2 text-sm text-white outline-none focus:border-accent"
            />
            <Button onClick={handleCreateWorkOrder} disabled={creating}>
              <span className="flex items-center gap-2">
                <Wrench size={14} /> {creating ? "Creating…" : "Create Work Order"}
              </span>
            </Button>
            {createMsg && <span className="text-sm text-accent">{createMsg}</span>}
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle title="Related Complaints" subtitle={`${complaints.length} citizen reports linked to this incident`} />
        {complaints.length === 0 ? (
          <EmptyState message="No complaints linked yet." />
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <div key={c.id} className="rounded-lg border border-base-700 bg-base-800/40 p-3">
                <div className="flex items-center justify-between">
                  <p className="mono text-xs text-base-500">{c.id}</p>
                  <StatusBadge status={c.status} />
                </div>
                <p className="mt-1 text-sm text-base-100">{c.description}</p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-base-500">
                  <MapPin size={12} /> {c.lat.toFixed(3)}, {c.lon.toFixed(3)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function IncidentDetailPage() {
  return (
    <ProtectedRoute roles={["admin", "department_officer", "field_officer"]}>
      <IncidentDetailContent />
    </ProtectedRoute>
  );
}
