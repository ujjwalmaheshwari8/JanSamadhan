"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Send } from "lucide-react";
import { ProtectedRoute } from "@/components/shell";
import { Button, Card, SectionTitle, SeverityBadge } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

const CATEGORIES = ["", "Water & Sanitation", "Roads", "Waste Management", "Streetlights"];

function ReportComplaintContent() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [lat, setLat] = useState("19.12");
  const [lon, setLon] = useState("72.88");
  const [urgency, setUrgency] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.createComplaint({
        description,
        category: category || undefined,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        urgency,
      });
      setResult(res);
      setDescription("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SectionTitle title="Report a Complaint" subtitle="Our AI civic engine will analyze and route your report automatically" />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-base-500">
              Describe the issue
            </label>
            <textarea
              required
              minLength={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="e.g. Brown water and a strange smell coming from the tap for two days"
              className="w-full rounded-lg border border-base-600 bg-base-800 px-3 py-2.5 text-sm text-white outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-base-500">
                Category (optional — AI will infer if left blank)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-base-600 bg-base-800 px-3 py-2.5 text-sm text-white outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c || "Auto-detect"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-base-500">Urgency</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full rounded-lg border border-base-600 bg-base-800 px-3 py-2.5 text-sm text-white outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-base-500">
                <MapPin size={12} /> Latitude
              </label>
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full rounded-lg border border-base-600 bg-base-800 px-3 py-2.5 text-sm text-white outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-base-500">
                <MapPin size={12} /> Longitude
              </label>
              <input
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                className="w-full rounded-lg border border-base-600 bg-base-800 px-3 py-2.5 text-sm text-white outline-none focus:border-accent"
              />
            </div>
          </div>

          {error && <div className="rounded-lg border border-crit/30 bg-crit/10 px-3 py-2 text-sm text-crit">{error}</div>}

          <Button type="submit" disabled={submitting}>
            <span className="flex items-center gap-2">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {submitting ? "Analyzing…" : "Submit Complaint"}
            </span>
          </Button>
        </form>
      </Card>

      {result && (
        <Card className="border-accent/30">
          <SectionTitle title="AI Analysis Complete" subtitle={`Complaint ${result.id} submitted successfully`} />
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-base-500">Category</span>
              <span className="text-white">{result.category}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base-500">Department routed to</span>
              <span className="text-white">{result.department}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base-500">Severity</span>
              <SeverityBadge severity={result.ai?.severity || "medium"} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base-500">AI confidence</span>
              <span className="mono text-white">{result.ai?.confidence}%</span>
            </div>
            <p className="mt-3 rounded-lg border border-base-700 bg-base-800/50 p-3 text-base-100">{result.ai?.summary}</p>
          </div>
          <div className="mt-4 flex gap-3">
            <Button variant="ghost" onClick={() => router.push("/complaints/mine")}>
              View my complaints
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function ReportComplaintPage() {
  return (
    <ProtectedRoute roles={["citizen"]}>
      <ReportComplaintContent />
    </ProtectedRoute>
  );
}
