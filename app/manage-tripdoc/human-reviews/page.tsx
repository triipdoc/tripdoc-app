"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ReviewStatus = "new" | "contacted" | "reviewed" | "closed";
type ReviewFilter = ReviewStatus | "all";

type HumanReviewRequest = {
  id: string;
  session_id: string;
  name: string | null;
  email: string | null;
  whatsapp: string | null;
  preferred_contact_method: string | null;
  message: string | null;
  consent_to_contact: boolean | null;
  consented_at: string | null;
  privacy_notice_version: string | null;
  status: ReviewStatus;
  contacted_at: string | null;
  reviewed_at: string | null;
  closed_at: string | null;
  admin_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  acquisition_source: string | null;
  session_created_at: string | null;
};

type ReviewsResponse = {
  requests: HumanReviewRequest[];
  counts: Record<ReviewStatus | "total", number>;
  filters: {
    status: ReviewFilter;
  };
};

type Notice = {
  type: "success" | "error";
  message: string;
} | null;

const statusFilters: { value: ReviewFilter; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "reviewed", label: "Reviewed" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
];

const workflowStatuses: { value: ReviewStatus; label: string }[] = [
  { value: "new", label: "Reopen New" },
  { value: "contacted", label: "Mark Contacted" },
  { value: "reviewed", label: "Mark Reviewed" },
  { value: "closed", label: "Mark Closed" },
];

const sectionCardStyle = {
  border: "1px solid #ddd",
  borderRadius: 14,
  padding: 24,
  background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
} as const;

const secondaryButtonStyle = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  cursor: "pointer",
  fontWeight: 600,
  textDecoration: "none",
} as const;

const primaryButtonStyle = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #0b5fff",
  background: "#0b5fff",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
} as const;

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatValue(value?: string | null) {
  return value?.trim() || "-";
}

function getStatusBadgeStyle(status: ReviewStatus) {
  if (status === "new") {
    return {
      background: "#eaf2ff",
      color: "#0b4db3",
      border: "1px solid #b9d3ff",
    };
  }

  if (status === "contacted") {
    return {
      background: "#fff8e5",
      color: "#7a4d00",
      border: "1px solid #f2d184",
    };
  }

  if (status === "reviewed") {
    return {
      background: "#edf8f0",
      color: "#1f6b37",
      border: "1px solid #b7dfc2",
    };
  }

  return {
    background: "#f4f5f7",
    color: "#475467",
    border: "1px solid #d9dde3",
  };
}

function getSourceLabel(value?: string | null) {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getMessagePreview(value?: string | null) {
  const message = value?.trim();
  if (!message) return "No message added.";
  return message.length > 110 ? `${message.slice(0, 110)}...` : message;
}

export default function HumanReviewsAdminPage() {
  const [requests, setRequests] = useState<HumanReviewRequest[]>([]);
  const [counts, setCounts] = useState<ReviewsResponse["counts"]>({
    total: 0,
    new: 0,
    contacted: 0,
    reviewed: 0,
    closed: 0,
  });
  const [statusFilter, setStatusFilter] = useState<ReviewFilter>("new");
  const [selectedId, setSelectedId] = useState<string>("");
  const [notesDraft, setNotesDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedId) || requests[0],
    [requests, selectedId]
  );

  async function loadReviews(filter = statusFilter) {
    setLoading(true);
    setNotice(null);

    try {
      const response = await fetch(`/api/admin/human-reviews?status=${filter}`);

      if (response.status === 401) {
        window.location.href = "/manage-tripdoc/login";
        return;
      }

      const data = (await response.json()) as ReviewsResponse | { error?: string };

      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Could not load reviews.");
      }

      const reviews = (data as ReviewsResponse).requests || [];
      setRequests(reviews);
      setCounts((data as ReviewsResponse).counts);
      setSelectedId((currentId) => {
        if (currentId && reviews.some((request) => request.id === currentId)) {
          return currentId;
        }

        return reviews[0]?.id || "";
      });
    } catch (error) {
      console.error("Human review load failed:", error);
      setNotice({
        type: "error",
        message: "Could not load human review requests.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    setNotesDraft(selectedRequest?.admin_notes || "");
  }, [selectedRequest?.id, selectedRequest?.admin_notes]);

  async function updateReview(
    requestId: string,
    payload: { status?: ReviewStatus; admin_notes?: string | null }
  ) {
    setSaving(true);
    setNotice(null);

    try {
      const response = await fetch(`/api/admin/human-reviews/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        window.location.href = "/manage-tripdoc/login";
        return;
      }

      const data = (await response.json()) as
        | { success: true; request: HumanReviewRequest }
        | { error?: string };

      if (!response.ok || !("success" in data)) {
        throw new Error("error" in data ? data.error : "Could not update review.");
      }

      setRequests((current) =>
        current.map((request) =>
          request.id === requestId ? { ...request, ...data.request } : request
        )
      );
      setNotice({ type: "success", message: "Human review request updated." });
    } catch (error) {
      console.error("Human review update failed:", error);
      setNotice({ type: "error", message: "Could not update this request." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ marginBottom: 12 }}>Human Reviews</h1>
          <p style={{ color: "#666", marginTop: 0 }}>
            Review optional Volunteer Match follow-up requests and track admin
            contact status.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/manage-tripdoc" style={secondaryButtonStyle}>
            Program Admin
          </Link>
          <Link href="/volunteer-match" target="_blank" rel="noreferrer" style={secondaryButtonStyle}>
            View Volunteer Match
          </Link>
          <button
            onClick={async () => {
              await fetch("/api/admin-logout", { method: "POST" });
              window.location.href = "/manage-tripdoc/login";
            }}
            style={secondaryButtonStyle}
          >
            Logout
          </button>
        </div>
      </div>

      {notice && (
        <div
          style={{
            marginBottom: 20,
            padding: "14px 16px",
            borderRadius: 10,
            border:
              notice.type === "success"
                ? "1px solid #b7dfc2"
                : "1px solid #efb7b7",
            background: notice.type === "success" ? "#edf8f0" : "#fff3f3",
            color: notice.type === "success" ? "#1f6b37" : "#b42318",
            fontWeight: 600,
          }}
        >
          {notice.message}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div style={{ ...sectionCardStyle, padding: 18 }}>
          <div style={{ color: "#666", fontSize: 13, marginBottom: 6 }}>
            New Requests
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{counts.new}</div>
        </div>
        <div style={{ ...sectionCardStyle, padding: 18 }}>
          <div style={{ color: "#666", fontSize: 13, marginBottom: 6 }}>
            Total Requests
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{counts.total}</div>
        </div>
        <div style={{ ...sectionCardStyle, padding: 18 }}>
          <div style={{ color: "#666", fontSize: 13, marginBottom: 6 }}>
            Contacted
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{counts.contacted}</div>
        </div>
        <div style={{ ...sectionCardStyle, padding: 18 }}>
          <div style={{ color: "#666", fontSize: 13, marginBottom: 6 }}>
            Reviewed
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{counts.reviewed}</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            style={{
              ...secondaryButtonStyle,
              ...(statusFilter === filter.value
                ? {
                    borderColor: "#0b5fff",
                    background: "#eaf2ff",
                    color: "#0b4db3",
                  }
                : {}),
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 18,
          alignItems: "start",
        }}
      >
        <section style={{ ...sectionCardStyle, padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "18px 20px",
              borderBottom: "1px solid #eee",
              background: "#fafafa",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20 }}>Requests</h2>
          </div>

          {loading ? (
            <p style={{ padding: 20, color: "#666" }}>Loading requests...</p>
          ) : requests.length === 0 ? (
            <p style={{ padding: 20, color: "#666" }}>
              No human review requests for this filter.
            </p>
          ) : (
            <div style={{ display: "grid" }}>
              {requests.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => setSelectedId(request.id)}
                  style={{
                    textAlign: "left",
                    border: "none",
                    borderBottom: "1px solid #eee",
                    background:
                      selectedRequest?.id === request.id ? "#f5f9ff" : "#fff",
                    padding: 18,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "flex-start",
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ fontWeight: 800, color: "#111" }}>
                      {formatValue(request.name)}
                    </div>
                    <span
                      style={{
                        ...getStatusBadgeStyle(request.status),
                        borderRadius: 999,
                        padding: "4px 9px",
                        fontSize: 12,
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {request.status}
                    </span>
                  </div>
                  <div style={{ color: "#555", fontSize: 14, marginBottom: 6 }}>
                    {formatDate(request.created_at)}
                  </div>
                  <div style={{ color: "#555", fontSize: 14, marginBottom: 6 }}>
                    Preferred: {formatValue(request.preferred_contact_method)}
                  </div>
                  <div style={{ color: "#555", fontSize: 14, marginBottom: 6 }}>
                    Source: {getSourceLabel(request.acquisition_source)}
                  </div>
                  <div style={{ color: "#333", fontSize: 14 }}>
                    {getMessagePreview(request.message)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section style={sectionCardStyle}>
          {!selectedRequest ? (
            <p style={{ color: "#666", margin: 0 }}>Select a request to review.</p>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  marginBottom: 18,
                }}
              >
                <div>
                  <h2 style={{ margin: 0 }}>{formatValue(selectedRequest.name)}</h2>
                  <p style={{ color: "#666", margin: "8px 0 0" }}>
                    Submitted {formatDate(selectedRequest.created_at)}
                  </p>
                </div>
                <span
                  style={{
                    ...getStatusBadgeStyle(selectedRequest.status),
                    borderRadius: 999,
                    padding: "6px 11px",
                    fontSize: 13,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectedRequest.status}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                  marginBottom: 18,
                }}
              >
                <InfoBlock label="Email" value={formatValue(selectedRequest.email)} />
                <InfoBlock
                  label="WhatsApp"
                  value={formatValue(selectedRequest.whatsapp)}
                />
                <InfoBlock
                  label="Preferred Contact"
                  value={formatValue(selectedRequest.preferred_contact_method)}
                />
                <InfoBlock
                  label="Acquisition Source"
                  value={getSourceLabel(selectedRequest.acquisition_source)}
                />
                <InfoBlock
                  label="Session ID"
                  value={formatValue(selectedRequest.session_id)}
                />
                <InfoBlock
                  label="Consent"
                  value={
                    selectedRequest.consent_to_contact
                      ? `Yes, ${formatDate(selectedRequest.consented_at)}`
                      : "No"
                  }
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <h3 style={{ margin: "0 0 8px" }}>Applicant Message</h3>
                <p
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 14,
                    color: "#111",
                  }}
                >
                  {formatValue(selectedRequest.message)}
                </p>
              </div>

              <div style={{ marginBottom: 18 }}>
                <h3 style={{ margin: "0 0 10px" }}>Workflow</h3>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {workflowStatuses.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        updateReview(selectedRequest.id, { status: status.value })
                      }
                      style={{
                        ...secondaryButtonStyle,
                        opacity: saving ? 0.65 : 1,
                        ...(selectedRequest.status === status.value
                          ? {
                              borderColor: "#0b5fff",
                              background: "#eaf2ff",
                              color: "#0b4db3",
                            }
                          : {}),
                      }}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <h3 style={{ margin: "0 0 8px" }}>Admin Notes</h3>
                <textarea
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                  rows={6}
                  style={{
                    width: "100%",
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 12,
                    resize: "vertical",
                    fontFamily: "Arial",
                  }}
                  placeholder="Add private admin notes. These are not shown to the applicant."
                />
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    updateReview(selectedRequest.id, {
                      admin_notes: notesDraft.trim() || null,
                    })
                  }
                  style={{
                    ...primaryButtonStyle,
                    marginTop: 10,
                    opacity: saving ? 0.65 : 1,
                  }}
                >
                  Save Notes
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                  color: "#666",
                  fontSize: 14,
                }}
              >
                <InfoBlock
                  label="Contacted At"
                  value={formatDate(selectedRequest.contacted_at)}
                />
                <InfoBlock
                  label="Reviewed At"
                  value={formatDate(selectedRequest.reviewed_at)}
                />
                <InfoBlock
                  label="Closed At"
                  value={formatDate(selectedRequest.closed_at)}
                />
                <InfoBlock
                  label="Updated At"
                  value={formatDate(selectedRequest.updated_at)}
                />
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: 10,
        padding: 12,
        background: "#fafafa",
        minWidth: 0,
      }}
    >
      <div style={{ color: "#667085", fontSize: 12, marginBottom: 5 }}>
        {label}
      </div>
      <div
        style={{
          color: "#111",
          fontWeight: 700,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
    </div>
  );
}
