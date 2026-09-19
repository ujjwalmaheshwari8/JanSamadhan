"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, PlayCircle, Send, Wrench } from "lucide-react";
import { ProtectedRoute } from "@/components/shell";
import { Button, Card, EmptyState, ErrorState, LoadingBlock, SectionTitle, StatusBadge } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Incident, WorkOrder } from "@/lib/types";

const NEXT_ACTION: Record<string, { label: string; next: string; icon: React.ReactNode } | undefined> = {
  created: { label: "Dispatch", next: "dispatched", icon: <Send size={13} /> },
  dispatched: { label: "Start", next: "in_progress", icon: <PlayCircle size={13} /> },
  in_progress: { label: "Complete", next: "completed", icon: <CheckCircle2 size={13} /> },
};

function WorkOrdersContent() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incidentId, setIncidentId] = useState("");
  const [action, setAction] = useState("Field inspection");
  const [creating, setCreating] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const [rowMsg, setRowMsg] = useState<{ id: string; text: string } | null>(null);

  const canCreate = user?.role === "admin" || user?.role === "department_officer";
  const canTransition = user?.role === "admin" || user?.role === "department_officer" || user?.role === "field_officer";

  function load() {
    setLoading(true);
    Promise.all([api.workOrders(), api.incidents()])
      .then(([wo, inc]) => {
        setOrders(wo);
        setIncidents(inc);
        setError(null);
        if (!incidentId && inc.length) setIncidentId(inc[0].id);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load work orders."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const incidentTitle = (id: string) => incidents.find((i) => i.id === id)?.title || id;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFormMsg(null);
    try {
      const wo = await api.createWorkOrder({ incident_id: incidentId, action });
      setFormMsg(`Work order ${wo.id} created.`);
      setOrders((prev) => [wo, ...prev]);
    } catch (err) {
      setFormMsg(err instanceof ApiError ? err.message : "Failed to create work order.");
    } finally {
      setCreating(false);
    }
  }

  async function handleTransition(w: WorkOrder) {
    const step = NEXT_ACTION[w.status];
    if (!step) return;
    setTransitioning(w.id);
    setRowMsg(null);
    try {
      // PATCH by existing WO id — updates status in place, never creates a new record.
      const updated = await api.updateWorkOrderStatus(w.id, step.next);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch (err) {
      setRowMsg({ id: w.id, text: err instanceof ApiError ? err.message : "Failed to update work order." });
    } finally {
      setTransitioning(null);
    }
  }

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <SectionTitle title="Work Orders" subtitle={`${orders.length} dispatch orders across all field crews`} />

      {canCreate && (
        <Card>
          <SectionTitle title="Create Work Order" subtitle="Opens a brand-new work order for an incident" />
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-base-500">Incident</label>
              <select
                value={incidentId}
                onChange={(e) => setIncidentId(e.target.value)}
                className="w-64 rounded-lg border border-base-600 bg-base-800 px-3 py-2 text-sm text-white outline-none"
              >
                {incidents.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.id} — {i.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-base-500">Action</label>
              <input
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-64 rounded-lg border border-base-600 bg-base-800 px-3 py-2 text-sm text-white outline-none focus:border-accent"
              />
            </div>
            <Button type="submit" disabled={creating || !incidentId}>
              <span className="flex items-center gap-2">
                <Wrench size={14} /> {creating ? "Creating…" : "Create Work Order"}
              </span>
            </Button>
            {formMsg && <span className="text-sm text-accent">{formMsg}</span>}
          </form>
        </Card>
      )}

      <Card>
        {orders.length === 0 ? (
          <EmptyState message="No work orders yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-base-700 text-xs uppercase tracking-wide text-base-500">
                  <th className="py-2 pr-4">Work Order</th>
                  <th className="py-2 pr-4">Incident</th>
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2 pr-4">Status</th>
                  {canTransition && <th className="py-2 pr-4">Lifecycle</th>}
                </tr>
              </thead>
              <tbody>
                {orders.map((w) => {
                  const step = NEXT_ACTION[w.status];
                  return (
                    <tr key={w.id} className="border-b border-base-700/50 hover:bg-base-800/50">
                      <td className="mono py-2.5 pr-4 text-base-100">{w.id}</td>
                      <td className="py-2.5 pr-4">
                        <Link href={`/incidents/${w.incident_id}`} className="text-white hover:text-accent">
                          {incidentTitle(w.incident_id)}
                        </Link>
                        <p className="mono text-xs text-base-500">{w.incident_id}</p>
                      </td>
                      <td className="py-2.5 pr-4 text-base-500">{w.action}</td>
                      <td className="py-2.5 pr-4">
                        <StatusBadge status={w.status} />
                      </td>
                      {canTransition && (
                        <td className="py-2.5 pr-4">
                          {step ? (
                            <Button
                              variant="ghost"
                              className="!px-3 !py-1.5 text-xs"
                              disabled={transitioning === w.id}
                              onClick={() => handleTransition(w)}
                            >
                              <span className="flex items-center gap-1.5">
                                {step.icon} {transitioning === w.id ? "Updating…" : step.label}
                              </span>
                            </Button>
                          ) : (
                            <span className="text-xs text-base-500">No further action</span>
                          )}
                          {rowMsg?.id === w.id && <p className="mt-1 text-xs text-crit">{rowMsg.text}</p>}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function WorkOrdersPage() {
  return (
    <ProtectedRoute roles={["admin", "department_officer", "field_officer"]}>
      <WorkOrdersContent />
    </ProtectedRoute>
  );
}
