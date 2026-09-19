"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/shell";
import { Card, ErrorState, LoadingBlock, SectionTitle } from "@/components/ui";
import { IncidentMap } from "@/components/incident-map";
import { api, ApiError } from "@/lib/api";
import type { Incident } from "@/lib/types";

function MapContent() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .incidents()
      .then((data) => alive && setIncidents(data))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Failed to load map data."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <SectionTitle title="Live Map" subtitle="Geospatial view of active incidents citywide" />
      <Card>
        <IncidentMap points={incidents} height={620} />
      </Card>
    </div>
  );
}

export default function MapPage() {
  return (
    <ProtectedRoute roles={["admin", "department_officer"]}>
      <MapContent />
    </ProtectedRoute>
  );
}
