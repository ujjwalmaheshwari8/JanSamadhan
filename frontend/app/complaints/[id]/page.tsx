"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { ProtectedRoute } from "@/components/shell";
import { Button, Card, ErrorState, LoadingBlock, SectionTitle, SeverityBadge, StatusBadge } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { Complaint } from "@/lib/types";

function ComplaintDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .getComplaint(params.id)
      .then(setComplaint)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load complaint."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function submitFeedback(resolved: boolean) {
    setSubmitting(true);
    setFeedbackMsg(null);
    try {
      await api.submitFeedback(params.id, { resolved, rating, comment: comment || undefined });
      setFeedbackMsg("Thank you — your feedback has been recorded.");
      load();
    } catch (e) {
      setFeedbackMsg(e instanceof ApiError ? e.message : "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorState message={error} />;
  if (!complaint) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button onClick={() => router.push("/complaints/mine")} className="flex items-center gap-1.5 text-sm text-base-500 hover:text-accent">
        <ArrowLeft size={16} /> Back to my complaints
      </button>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="mono text-xs text-base-500">{complaint.id}</p>
          <StatusBadge status={complaint.status} />
        </div>
        <p className="text-base text-white">{complaint.description}</p>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-base-500">Category</span>
            <span className="text-white">{complaint.category}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-base-500">Department</span>
            <span className="text-white">{complaint.department}</span>
          </div>
          {complaint.ai && (
            <div className="flex items-center justify-between">
              <span className="text-base-500">AI severity assessment</span>
              <SeverityBadge severity={complaint.ai.severity} />
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-base-500">Submitted</span>
            <span className="text-white">{new Date(complaint.submitted_at).toLocaleString()}</span>
          </div>
          {complaint.incident_id && (
            <div className="flex items-center justify-between">
              <span className="text-base-500">Linked incident</span>
              <span className="mono text-white">{complaint.incident_id}</span>
            </div>
          )}
        </div>
        {complaint.ai?.summary && (
          <p className="mt-4 rounded-lg border border-base-700 bg-base-800/50 p-3 text-sm text-base-100">
            {complaint.ai.summary}
          </p>
        )}
      </Card>

      <Card>
        <SectionTitle title="Was this resolved?" subtitle="Your feedback helps close the loop and improves routing accuracy" />
        <div className="mb-4 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} type="button">
              <Star size={22} className={n <= rating ? "fill-warn text-warn" : "text-base-600"} />
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional comment"
          rows={3}
          className="mb-4 w-full rounded-lg border border-base-600 bg-base-800 px-3 py-2.5 text-sm text-white outline-none focus:border-accent"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => submitFeedback(true)} disabled={submitting}>
            Mark as resolved
          </Button>
          <Button variant="ghost" onClick={() => submitFeedback(false)} disabled={submitting}>
            Still an issue
          </Button>
          {feedbackMsg && <span className="text-sm text-accent">{feedbackMsg}</span>}
        </div>
      </Card>
    </div>
  );
}

export default function ComplaintDetailPage() {
  return (
    <ProtectedRoute roles={["citizen"]}>
      <ComplaintDetailContent />
    </ProtectedRoute>
  );
}
