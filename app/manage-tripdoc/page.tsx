"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

type VerificationStatus = "verified" | "pending";



type Program = {
  id: string;
  title: string;
  slug: string | null;
  country: string | null;
  type: string | null;
  funding_type: string | null;
  deadline: string | null;
  official_url: string | null;
  image_url: string | null;
  description: string | null;
  verification_status: VerificationStatus | null;
  featured?: boolean | null;
  created_at?: string | null;
};

type AnalyticsRow = {
  program_id: string;
  title: string;
  count: number;
};

type AnalyticsLabelRow = {
  label: string;
  count: number;
};

type AnalyticsRange = "last7days" | "last30days" | "alltime";

type AnalyticsData = {
  range: AnalyticsRange;
  totalClicks: number;
  totalApplyClicks: number;
  totalCopyClicks: number;
  topClicked: AnalyticsRow[];
  topApplied: AnalyticsRow[];
  topShared: AnalyticsRow[];
  topCountries: AnalyticsLabelRow[];
  topOpportunityTypes: AnalyticsLabelRow[];
};

type FormErrors = {
  title?: string;
  slug?: string;
  country?: string;
  type?: string;
  officialUrl?: string;
  imageUrl?: string;
};

type Notice = {
  type: "success" | "error";
  message: string;
} | null;

type SortOption =
  | "newest"
  | "oldest"
  | "title-asc"
  | "title-desc"
  | "deadline-asc"
  | "deadline-desc"
  | "featured-first";

type ProgramsResponse = {
  programs: Program[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search: string;
    sortBy: SortOption;
  };
};

const PAGE_SIZE = 10;


function generateSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isValidUrl(value: string) {
  if (!value.trim()) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getRangeLabel(range: AnalyticsRange) {
  switch (range) {
    case "last30days":
      return "Last 30 Days";
    case "alltime":
      return "All Time";
    case "last7days":
    default:
      return "Last 7 Days";
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const sectionCardStyle = {
  border: "1px solid #ddd",
  borderRadius: 14,
  padding: 24,
  background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
} as const;

const inputStyle = {
  padding: 12,
  borderRadius: 8,
  border: "1px solid #ddd",
  width: "100%",
} as const;

function insertAtCursor(
  currentValue: string,
  insertText: string,
  textarea: HTMLTextAreaElement | null
) {
  if (!textarea) return currentValue + insertText;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  return (
    currentValue.slice(0, start) +
    insertText +
    currentValue.slice(end)
  );
}

async function uploadProgramImage(file: File) {
  const ext = file.name.split(".").pop() || "jpg";
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
  const fileName = `${Date.now()}-${safeName}`;
  const filePath = `programs/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("program-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage
    .from("program-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export default function AdminPage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [country, setCountry] = useState("");
  const [type, setType] = useState("");
  const [funding, setFunding] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [featured, setFeatured] = useState(false);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("verified");

  const [programs, setPrograms] = useState<Program[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [quickActionId, setQuickActionId] = useState<string | null>(null);
  const [programsLoading, setProgramsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPrograms, setTotalPrograms] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsRange, setAnalyticsRange] =
    useState<AnalyticsRange>("last7days");

  const [notice, setNotice] = useState<Notice>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [slugTouched, setSlugTouched] = useState(false);
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
const [imagePreviewUrl, setImagePreviewUrl] = useState("");
const [uploadingImage, setUploadingImage] = useState(false);

const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  

  const loadPrograms = async ({
    page = currentPage,
    searchValue = search,
    sortValue = sortBy,
  }: {
    page?: number;
    searchValue?: string;
    sortValue?: SortOption;
  } = {}) => {
    try {
      setProgramsLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        search: searchValue,
        sortBy: sortValue,
      });

      const res = await fetch(`/api/admin/programs?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const result: ProgramsResponse | { error?: string } = await res.json();

      if (!res.ok) {
        console.error("Programs load failed:", result);
        setNotice({
          type: "error",
          message:
            "error" in result && result.error
              ? result.error
              : "Could not load programs.",
        });
        return;
      }

      const data = result as ProgramsResponse;

      setPrograms(data.programs || []);
      setCurrentPage(data.pagination.page || 1);
      setTotalPrograms(data.pagination.total || 0);
      setTotalPages(data.pagination.totalPages || 1);
    } catch (error) {
      console.error("Programs fetch failed:", error);
      setNotice({ type: "error", message: "Could not load programs." });
    } finally {
      setProgramsLoading(false);
    }
  };

  const loadAnalytics = async (range: AnalyticsRange = analyticsRange) => {
    try {
      setAnalyticsLoading(true);

      const res = await fetch(`/api/admin-analytics?range=${range}`, {
        method: "GET",
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("Analytics load failed:", result);
        setNotice({ type: "error", message: "Could not load analytics." });
        return;
      }

      setAnalytics(result);
    } catch (error) {
      console.error("Analytics fetch failed:", error);
      setNotice({ type: "error", message: "Analytics fetch failed." });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics(analyticsRange);
  }, [analyticsRange]);

  useEffect(() => {
    loadPrograms({
      page: currentPage,
      searchValue: search,
      sortValue: sortBy,
    });
  }, [currentPage, search, sortBy]);

  const resetForm = () => {
  setTitle("");
  setSlug("");
  setCountry("");
  setType("");
  setFunding("");
  setDeadline("");
  setDescription("");
  setOfficialUrl("");
  setImageUrl("");
  setImageFile(null);
  setImagePreviewUrl("");
  setFeatured(false);
  setVerificationStatus("verified");
  setEditingId(null);
  setFormErrors({});
  setSlugTouched(false);
  setOriginalTitle("");
  setOriginalSlug("");
};

  const handleTitleChange = (value: string) => {
    setTitle(value);

    const nextAutoSlug = generateSlug(value);

    if (!slugTouched) {
      setSlug(nextAutoSlug);
      return;
    }

    const previousAutoSlug = generateSlug(originalTitle || "");
    const currentSlugWasAuto =
      slug === previousAutoSlug || slug === generateSlug(title);

    if (editingId && currentSlugWasAuto) {
      setSlug(nextAutoSlug);
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setSlug(generateSlug(value));
  };

  const addProgram = async () => {
    setNotice(null);

    const finalSlug = generateSlug(slug || title);
    if (!finalSlug) {
      setFormErrors((prev) => ({
        ...prev,
        slug: "Slug is required.",
      }));
      return;
    }

    setSlug(finalSlug);

    const nextErrors: FormErrors = {};

    if (!title.trim()) nextErrors.title = "Title is required.";
    if (!finalSlug.trim()) nextErrors.slug = "Slug is required.";
    if (!country.trim()) nextErrors.country = "Country is required.";
    if (!type.trim()) nextErrors.type = "Type is required.";
    if (officialUrl.trim() && !isValidUrl(officialUrl)) {
      nextErrors.officialUrl = "Official URL must be a valid http/https link.";
    }
    if (imageUrl.trim() && !isValidUrl(imageUrl)) {
      nextErrors.imageUrl = "Image URL must be a valid http/https link.";
    }

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
  setLoading(true);

  let finalImageUrl = imageUrl.trim();

  if (imageFile) {
    setUploadingImage(true);
    finalImageUrl = await uploadProgramImage(imageFile);
  }

  const res = await fetch("/api/admin/programs", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: title.trim(),
    slug: finalSlug,
    country: country.trim(),
    type: type.trim(),
    funding_type: funding.trim(),
    deadline: deadline || "",
    official_url: officialUrl.trim(),
    image_url: finalImageUrl,
    description: description.trim(),
    verification_status: verificationStatus,
    featured,
  }),
});

      const result = await res.json();

      if (!res.ok) {
        if (
          typeof result?.error === "string" &&
          result.error.toLowerCase().includes("slug")
        ) {
          setFormErrors((prev) => ({
            ...prev,
            slug: result.error,
          }));
        }

        setNotice({
          type: "error",
          message: result.error || "Failed to create program.",
        });
        return;
      }

      setNotice({ type: "success", message: "Program added successfully." });
      resetForm();
      setCurrentPage(1);
      await loadPrograms({ page: 1, searchValue: search, sortValue: sortBy });
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        message: "Something went wrong while adding the program.",
      });
    } finally {
      setLoading(false);
setUploadingImage(false);
    }
  };

  const updateProgram = async () => {
    if (!editingId) return;

    setNotice(null);

    const finalSlug = generateSlug(slug || title);
    if (!finalSlug) {
      setFormErrors((prev) => ({
        ...prev,
        slug: "Slug is required.",
      }));
      return;
    }

    setSlug(finalSlug);

    const nextErrors: FormErrors = {};

    if (!title.trim()) nextErrors.title = "Title is required.";
    if (!finalSlug.trim()) nextErrors.slug = "Slug is required.";
    if (!country.trim()) nextErrors.country = "Country is required.";
    if (!type.trim()) nextErrors.type = "Type is required.";
    if (officialUrl.trim() && !isValidUrl(officialUrl)) {
      nextErrors.officialUrl = "Official URL must be a valid http/https link.";
    }
    if (imageUrl.trim() && !isValidUrl(imageUrl)) {
      nextErrors.imageUrl = "Image URL must be a valid http/https link.";
    }

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
  setLoading(true);

  let finalImageUrl = imageUrl.trim();

  if (imageFile) {
    setUploadingImage(true);
    finalImageUrl = await uploadProgramImage(imageFile);
  }

  const res = await fetch(`/api/admin/programs/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          slug: finalSlug,
          country: country.trim(),
          type: type.trim(),
          funding_type: funding.trim(),
          deadline: deadline || "",
          official_url: officialUrl.trim(),
          image_url: finalImageUrl,
          description: description.trim(),
          verification_status: verificationStatus,
          featured,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (
          typeof result?.error === "string" &&
          result.error.toLowerCase().includes("slug")
        ) {
          setFormErrors((prev) => ({
            ...prev,
            slug: result.error,
          }));
        }

        setNotice({
          type: "error",
          message: result.error || "Failed to update program.",
        });
        return;
      }

      setNotice({ type: "success", message: "Program updated successfully." });
      resetForm();
      await loadPrograms({
        page: currentPage,
        searchValue: search,
        sortValue: sortBy,
      });
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        message: "Something went wrong while updating the program.",
      });
    } finally {
      setLoading(false);
setUploadingImage(false);
    }
  };

  const updateProgramQuick = async (
    program: Program,
    updates: Partial<Program>,
    successMessage: string
  ) => {
    try {
      setQuickActionId(program.id);
      setNotice(null);

      const res = await fetch(`/api/admin/programs/${program.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: updates.title ?? program.title ?? "",
          slug: updates.slug ?? program.slug ?? generateSlug(program.title || ""),
          country: updates.country ?? program.country ?? "",
          type: updates.type ?? program.type ?? "",
          funding_type: updates.funding_type ?? program.funding_type ?? "",
          deadline: updates.deadline ?? program.deadline ?? "",
          official_url: updates.official_url ?? program.official_url ?? "",
          image_url: updates.image_url ?? program.image_url ?? "",
          description: updates.description ?? program.description ?? "",
          verification_status:
            updates.verification_status ??
            program.verification_status ??
            "pending",
          featured: updates.featured ?? Boolean(program.featured),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setNotice({
          type: "error",
          message: result.error || "Quick update failed.",
        });
        return;
      }

      setNotice({ type: "success", message: successMessage });
      await loadPrograms({
        page: currentPage,
        searchValue: search,
        sortValue: sortBy,
      });
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        message: "Something went wrong while updating this program.",
      });
    } finally {
      setQuickActionId(null);
    }
  };

  const toggleProgramStatus = async (program: Program) => {
    const nextStatus: VerificationStatus =
      program.verification_status === "verified" ? "pending" : "verified";

    await updateProgramQuick(
      program,
      { verification_status: nextStatus },
      `Program marked as ${nextStatus}.`
    );
  };

  const toggleProgramFeatured = async (program: Program) => {
    const nextFeatured = !Boolean(program.featured);

    await updateProgramQuick(
      program,
      { featured: nextFeatured },
      nextFeatured
        ? "Program added to featured."
        : "Program removed from featured."
    );
  };

  const deleteProgram = async (id: string, programTitle: string) => {
  const typedTitle = window.prompt(
    `To delete this program, type the exact title below:\n\n${programTitle}`
  );

  if (typedTitle === null) return;

  if (typedTitle.trim() !== programTitle.trim()) {
    setNotice({
      type: "error",
      message: "Delete cancelled. Title did not match exactly.",
    });
    return;
  }

  try {
    setDeleteLoadingId(id);
    setNotice(null);

    const res = await fetch(`/api/admin/programs/${id}`, {
      method: "DELETE",
    });

    const result = await res.json();

    if (!res.ok) {
      setNotice({
        type: "error",
        message: result.error || "Failed to delete program.",
      });
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    setNotice({ type: "success", message: "Program deleted successfully." });

    const nextPage =
      programs.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;

    setCurrentPage(nextPage);
    await loadPrograms({
      page: nextPage,
      searchValue: search,
      sortValue: sortBy,
    });
  } catch (error) {
    console.error(error);
    setNotice({
      type: "error",
      message: "Something went wrong while deleting the program.",
    });
  } finally {
    setDeleteLoadingId(null);
  }
};

  const startEdit = (program: Program) => {
    setEditingId(program.id);
    setTitle(program.title || "");
    setSlug(program.slug || generateSlug(program.title || ""));
    setCountry(program.country || "");
    setType(program.type || "");
    setFunding(program.funding_type || "");
    setDeadline(program.deadline || "");
    setOfficialUrl(program.official_url || "");
    setImageUrl(program.image_url || "");
    setImageFile(null);
setImagePreviewUrl(program.image_url || "");
    setDescription(program.description || "");
    setFeatured(Boolean(program.featured));
    setVerificationStatus(
      (program.verification_status as VerificationStatus) || "pending"
    );
    setFormErrors({});
    setNotice(null);
    setSlugTouched(false);
    setOriginalTitle(program.title || "");
    setOriginalSlug(program.slug || generateSlug(program.title || ""));

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
          <h1 style={{ marginBottom: 12 }}>Admin Dashboard</h1>
          <p style={{ color: "#666", marginTop: 0 }}>
            Add, edit, and manage TripDoc opportunities from one place.
          </p>
        </div>

        <button
          onClick={async () => {
            await fetch("/api/admin-logout", { method: "POST" });
            window.location.href = "/manage-tripdoc/login";
          }}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Logout
        </button>
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

      <div style={{ ...sectionCardStyle, marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Analytics Overview</h2>
            <p style={{ color: "#666", margin: "8px 0 0 0" }}>
              Live click performance from TripDoc user activity.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <select
              value={analyticsRange}
              onChange={(e) =>
                setAnalyticsRange(e.target.value as AnalyticsRange)
              }
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: "#fff",
              }}
            >
              <option value="last7days">Last 7 days</option>
              <option value="last30days">Last 30 days</option>
              <option value="alltime">All time</option>
            </select>

            <button
              onClick={() => loadAnalytics()}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Refresh Analytics
            </button>
          </div>
        </div>

        {analyticsLoading ? (
          <p style={{ color: "#666" }}>Loading analytics...</p>
        ) : analytics ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 14,
                marginBottom: 24,
              }}
            >
              <div style={{ ...sectionCardStyle, padding: 18 }}>
                <div style={{ color: "#666", fontSize: 13, marginBottom: 6 }}>
                  Total Clicks
                </div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>
                  {analytics.totalClicks}
                </div>
              </div>

              <div style={{ ...sectionCardStyle, padding: 18 }}>
                <div style={{ color: "#666", fontSize: 13, marginBottom: 6 }}>
                  Apply Clicks
                </div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>
                  {analytics.totalApplyClicks}
                </div>
              </div>

              <div style={{ ...sectionCardStyle, padding: 18 }}>
                <div style={{ color: "#666", fontSize: 13, marginBottom: 6 }}>
                  Copy Clicks
                </div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>
                  {analytics.totalCopyClicks}
                </div>
              </div>

              <div style={{ ...sectionCardStyle, padding: 18 }}>
                <div style={{ color: "#666", fontSize: 13, marginBottom: 6 }}>
                  Selected Range
                </div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>
                  {getRangeLabel(analytics.range)}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              <div style={sectionCardStyle}>
                <h3 style={{ marginTop: 0 }}>Top Clicked</h3>
                {analytics.topClicked.length === 0 ? (
                  <p style={{ color: "#666", marginBottom: 0 }}>
                    No click data yet.
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {analytics.topClicked.map((item, index) => (
                      <div
                        key={`${item.program_id}-clicked`}
                        style={{
                          border: "1px solid #eee",
                          borderRadius: 10,
                          padding: 12,
                          background: "#fafafa",
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>
                          {index + 1}. {item.title}
                        </div>
                        <div style={{ color: "#666", fontSize: 14 }}>
                          {item.count} clicks
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={sectionCardStyle}>
                <h3 style={{ marginTop: 0 }}>Most Applied</h3>
                {analytics.topApplied.length === 0 ? (
                  <p style={{ color: "#666", marginBottom: 0 }}>
                    No apply data yet.
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {analytics.topApplied.map((item, index) => (
                      <div
                        key={`${item.program_id}-applied`}
                        style={{
                          border: "1px solid #eee",
                          borderRadius: 10,
                          padding: 12,
                          background: "#fafafa",
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>
                          {index + 1}. {item.title}
                        </div>
                        <div style={{ color: "#666", fontSize: 14 }}>
                          {item.count} apply clicks
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={sectionCardStyle}>
                <h3 style={{ marginTop: 0 }}>Most Shared</h3>
                {analytics.topShared.length === 0 ? (
                  <p style={{ color: "#666", marginBottom: 0 }}>
                    No share data yet.
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {analytics.topShared.map((item, index) => (
                      <div
                        key={`${item.program_id}-shared`}
                        style={{
                          border: "1px solid #eee",
                          borderRadius: 10,
                          padding: 12,
                          background: "#fafafa",
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>
                          {index + 1}. {item.title}
                        </div>
                        <div style={{ color: "#666", fontSize: 14 }}>
                          {item.count} shares
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={sectionCardStyle}>
                <h3 style={{ marginTop: 0 }}>Top Countries</h3>
                {analytics.topCountries.length === 0 ? (
                  <p style={{ color: "#666", marginBottom: 0 }}>
                    No country data yet.
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {analytics.topCountries.map((item, index) => (
                      <div
                        key={`${item.label}-country`}
                        style={{
                          border: "1px solid #eee",
                          borderRadius: 10,
                          padding: 12,
                          background: "#fafafa",
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>
                          {index + 1}. {item.label}
                        </div>
                        <div style={{ color: "#666", fontSize: 14 }}>
                          {item.count} clicks
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={sectionCardStyle}>
                <h3 style={{ marginTop: 0 }}>Top Opportunity Types</h3>
                {analytics.topOpportunityTypes.length === 0 ? (
                  <p style={{ color: "#666", marginBottom: 0 }}>
                    No type data yet.
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {analytics.topOpportunityTypes.map((item, index) => (
                      <div
                        key={`${item.label}-type`}
                        style={{
                          border: "1px solid #eee",
                          borderRadius: 10,
                          padding: 12,
                          background: "#fafafa",
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>
                          {index + 1}. {item.label}
                        </div>
                        <div style={{ color: "#666", fontSize: 14 }}>
                          {item.count} clicks
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <p style={{ color: "#c62828" }}>Could not load analytics.</p>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          maxWidth: 760,
          marginBottom: 40,
          border: "1px solid #ddd",
          borderRadius: 14,
          padding: 24,
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>
          {editingId ? "Edit Opportunity" : "Add New Opportunity"}
        </h2>

        <p style={{ color: "#666", marginTop: 0, marginBottom: 16 }}>
          Fill in the details below and save the opportunity.
        </p>

        <div>
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            style={inputStyle}
          />
          {formErrors.title && (
            <div style={{ color: "#c62828", fontSize: 13, marginTop: 6 }}>
              {formErrors.title}
            </div>
          )}
        </div>

        <div>
          <input
            placeholder="Slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            style={inputStyle}
          />
          {formErrors.slug && (
            <div style={{ color: "#c62828", fontSize: 13, marginTop: 6 }}>
              {formErrors.slug}
            </div>
          )}
          <div style={{ color: "#666", fontSize: 12, marginTop: 6 }}>
            URL slug preview: /programs/{slug || "your-program-slug"}
          </div>
          {editingId && originalSlug && originalSlug !== slug && (
            <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
              Original slug: {originalSlug}
            </div>
          )}
        </div>

        <div>
          <input
            placeholder="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            style={inputStyle}
          />
          {formErrors.country && (
            <div style={{ color: "#c62828", fontSize: 13, marginTop: 6 }}>
              {formErrors.country}
            </div>
          )}
        </div>

        <div>
          <input
            placeholder="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={inputStyle}
          />
          {formErrors.type && (
            <div style={{ color: "#c62828", fontSize: 13, marginTop: 6 }}>
              {formErrors.type}
            </div>
          )}
        </div>

        <input
          placeholder="Funding"
          value={funding}
          onChange={(e) => setFunding(e.target.value)}
          style={inputStyle}
        />

        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          style={inputStyle}
        />

        <div>
          <input
            placeholder="Official URL"
            value={officialUrl}
            onChange={(e) => setOfficialUrl(e.target.value)}
            style={inputStyle}
          />
          {formErrors.officialUrl && (
            <div style={{ color: "#c62828", fontSize: 13, marginTop: 6 }}>
              {formErrors.officialUrl}
            </div>
          )}
        </div>

<div>
  <input
    placeholder="Image URL (optional if uploading a file)"
    value={imageUrl}
    onChange={(e) => {
      setImageUrl(e.target.value);
      if (e.target.value.trim()) {
        setImagePreviewUrl(e.target.value);
        setImageFile(null);
      }
    }}
    style={inputStyle}
  />
  {formErrors.imageUrl && (
    <div style={{ color: "#c62828", fontSize: 13, marginTop: 6 }}>
      {formErrors.imageUrl}
    </div>
  )}
</div>

<div>
  <label
    style={{
      display: "block",
      marginBottom: 8,
      fontWeight: 600,
    }}
  >
    Upload Image
  </label>

  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0] || null;
      setImageFile(file);

      if (file) {
        const localPreview = URL.createObjectURL(file);
        setImagePreviewUrl(localPreview);
        setImageUrl("");
      }
    }}
    style={{
      ...inputStyle,
      padding: 10,
      background: "#fff",
    }}
  />

  <div style={{ color: "#666", fontSize: 12, marginTop: 6 }}>
    You can either paste an image URL or upload an image file.
  </div>
</div>

{imagePreviewUrl && (
  <div style={{ marginTop: 12 }}>
    <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
      Image Preview
    </div>

    <img
      src={imagePreviewUrl}
      alt="Preview"
      style={{
        width: "100%",
        maxWidth: 420,
        height: 180,
        objectFit: "cover",
        borderRadius: 8,
        border: "1px solid #ddd",
      }}
    />
  </div>
)}

        <div>
  <div
    style={{
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      marginBottom: 10,
    }}
  >
    <button
      type="button"
      onClick={() =>
        setDescription((prev) =>
          insertAtCursor(
            prev,
            "\nBenefits:\n- \n- \n",
            descriptionRef.current
          )
        )
      }
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid #ddd",
        background: "#fff",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      + Benefits
    </button>

    <button
      type="button"
      onClick={() =>
        setDescription((prev) =>
          insertAtCursor(
            prev,
            "\nEligibility:\n- \n- \n",
            descriptionRef.current
          )
        )
      }
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid #ddd",
        background: "#fff",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      + Eligibility
    </button>

    <button
      type="button"
      onClick={() =>
        setDescription((prev) =>
          insertAtCursor(
            prev,
            "\nHow to Apply:\n1. \n2. \n3. \n",
            descriptionRef.current
          )
        )
      }
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid #ddd",
        background: "#fff",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      + How to Apply
    </button>

    <button
      type="button"
      onClick={() =>
        setDescription((prev) =>
          insertAtCursor(
            prev,
            "\nDeadline:\n- \n",
            descriptionRef.current
          )
        )
      }
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid #ddd",
        background: "#fff",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      + Deadline
    </button>
  </div>

  <textarea
    ref={descriptionRef}
    placeholder="Program Description"
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    style={{
      padding: 12,
      borderRadius: 8,
      border: "1px solid #ddd",
      minHeight: 260,
      resize: "vertical",
      width: "100%",
      lineHeight: 1.6,
      fontSize: 15,
    }}
  />
  <button
  type="button"
  onClick={() => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.slice(start, end);
    const wrapped = `**${selectedText || "bold text"}**`;

    setDescription((prev) => 
      prev.slice(0, start) + wrapped + prev.slice(end)
    );
  }}
  style={{
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  }}
>
  Bold
</button>
</div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Status
            </label>
            <select
              value={verificationStatus}
              onChange={(e) =>
                setVerificationStatus(e.target.value as VerificationStatus)
              }
              style={inputStyle}
            >
              <option value="verified">verified</option>
              <option value="pending">pending</option>
            </select>
          </div>

          <div style={{ alignSelf: "end" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 600,
                marginTop: 28,
              }}
            >
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              Featured Opportunity
            </label>
          </div>
        </div>

        <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={editingId ? updateProgram : addProgram}
            disabled={loading || uploadingImage}
            style={{
              padding: "12px 16px",
              background: "black",
              color: "white",
              borderRadius: 8,
              border: "none",
              cursor: loading || uploadingImage ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 600,
              width: "fit-content",
              minWidth: 170,
              opacity: loading || uploadingImage ? 0.7 : 1,
            }}
          >
            {uploadingImage
  ? "Uploading image..."
  : loading
  ? "Saving..."
  : editingId
  ? "Update Opportunity"
  : "Add Opportunity"}
          </button>

          {editingId && (
            <button
              onClick={resetForm}
              disabled={loading}
              style={{
                padding: "12px 16px",
                background: "#eee",
                color: "#333",
                borderRadius: 8,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          ...sectionCardStyle,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 12,
          }}
        >
          <input
            placeholder="Search by title, slug, country, type, funding, or status"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={inputStyle}
          />

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as SortOption);
              setCurrentPage(1);
            }}
            style={inputStyle}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title-asc">Title A–Z</option>
            <option value="title-desc">Title Z–A</option>
            <option value="deadline-asc">Deadline soonest</option>
            <option value="deadline-desc">Deadline latest</option>
            <option value="featured-first">Featured first</option>
          </select>
        </div>
      </div>

      <h2 style={{ marginBottom: 16 }}>All Programs</h2>
      <p style={{ color: "#666", marginTop: 0, marginBottom: 16 }}>
        Showing {programs.length} on this page ({totalPrograms} total)
      </p>

      {programsLoading ? (
        <div style={{ ...sectionCardStyle, color: "#666" }}>
          Loading programs...
        </div>
      ) : programs.length === 0 ? (
        <div style={{ ...sectionCardStyle, color: "#666" }}>
          No programs found for the current search.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {programs.map((program) => {
            const isQuickUpdating = quickActionId === program.id;
            const isDeleting = deleteLoadingId === program.id;

            return (
              <div
                key={program.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: 16,
                  background: "#fafafa",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                }}
              >
                {program.image_url && (
                  <img
                    src={program.image_url}
                    alt={program.title}
                    style={{
                      width: "100%",
                      maxWidth: 320,
                      height: 160,
                      objectFit: "cover",
                      borderRadius: 8,
                      marginBottom: 12,
                      display: "block",
                      border: "1px solid #eee",
                    }}
                  />
                )}

                <h3 style={{ marginTop: 0, marginBottom: 10 }}>{program.title}</h3>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 10,
                  }}
                >
                  {program.featured && (
                    <div
                      style={{
                        display: "inline-block",
                        padding: "6px 10px",
                        background: "#fff4d6",
                        color: "#8a5a00",
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      ⭐ Featured
                    </div>
                  )}

                  <div
                    style={{
                      display: "inline-block",
                      padding: "6px 10px",
                      background:
                        program.verification_status === "verified"
                          ? "#edf8f0"
                          : "#fff7e6",
                      color:
                        program.verification_status === "verified"
                          ? "#1f6b37"
                          : "#8a5a00",
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 13,
                      textTransform: "capitalize",
                    }}
                  >
                    {program.verification_status || "pending"}
                  </div>
                </div>

                <p>
                  <strong>Slug:</strong> {program.slug || "—"}
                </p>
                <p>
                  <strong>Country:</strong> {program.country || "—"}
                </p>
                <p>
                  <strong>Type:</strong> {program.type || "—"}
                </p>
                <p>
                  <strong>Funding:</strong> {program.funding_type || "—"}
                </p>
                <p>
                  <strong>Deadline:</strong> {program.deadline || "—"}
                </p>
                <p>
                  <strong>Created:</strong> {formatDate(program.created_at)}
                </p>

                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  {program.slug && (
                    <a
                      href={`/programs/${program.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: "10px 14px",
                        background: "#fff",
                        color: "#111",
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      View
                    </a>
                  )}

                  <button
                    onClick={() => startEdit(program)}
                    style={{
                      padding: "10px 14px",
                      background: "#1976d2",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => toggleProgramStatus(program)}
                    disabled={isQuickUpdating || isDeleting}
                    style={{
                      padding: "10px 14px",
                      background: "#fff",
                      color: "#111",
                      border: "1px solid #ddd",
                      borderRadius: 8,
                      cursor:
                        isQuickUpdating || isDeleting ? "not-allowed" : "pointer",
                      opacity: isQuickUpdating || isDeleting ? 0.7 : 1,
                      fontWeight: 600,
                    }}
                  >
                    {isQuickUpdating
                      ? "Updating..."
                      : program.verification_status === "verified"
                      ? "Mark Pending"
                      : "Mark Verified"}
                  </button>

                  <button
                    onClick={() => toggleProgramFeatured(program)}
                    disabled={isQuickUpdating || isDeleting}
                    style={{
                      padding: "10px 14px",
                      background: "#fff",
                      color: "#111",
                      border: "1px solid #ddd",
                      borderRadius: 8,
                      cursor:
                        isQuickUpdating || isDeleting ? "not-allowed" : "pointer",
                      opacity: isQuickUpdating || isDeleting ? 0.7 : 1,
                      fontWeight: 600,
                    }}
                  >
                    {isQuickUpdating
                      ? "Updating..."
                      : program.featured
                      ? "Unfeature"
                      : "Feature"}
                  </button>

                  <button
                    onClick={() => deleteProgram(program.id, program.title)}
                    disabled={isDeleting || isQuickUpdating}
                    style={{
                      padding: "10px 14px",
                      background: "#c62828",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      cursor:
                        isDeleting || isQuickUpdating
                          ? "not-allowed"
                          : "pointer",
                      opacity: isDeleting || isQuickUpdating ? 0.7 : 1,
                    }}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div
          style={{
            marginTop: 24,
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              opacity: currentPage === 1 ? 0.6 : 1,
            }}
          >
            Previous
          </button>

          <div style={{ fontWeight: 600 }}>
            Page {currentPage} of {totalPages}
          </div>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              opacity: currentPage === totalPages ? 0.6 : 1,
            }}
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}