import CopyLinkButton from "./CopyLinkButton";
import { supabase } from "../../../lib/supabase";

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
  verification_status: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data } = await supabase
    .from("programs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!data) return {};

  return {
    title: data.title + " | TripDoc",
    description:
      data.description ||
      "Verified scholarships, internships and research opportunities.",
  };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
  return (
    <main style={{ padding: 40, fontFamily: "Arial" }}>
      <a
        href="/"
        style={{
          display: "inline-block",
          marginBottom: 20,
          textDecoration: "none",
          color: "#0070f3",
          fontWeight: 600,
        }}
      >
        ← Back to home
      </a>

      <h1>Program not found</h1>
    </main>
  );
}

  const program = data as Program;

  return (
  <main style={{ padding: 40, fontFamily: "Arial" }}>
    <a
      href="/"
      style={{
        display: "inline-block",
        marginBottom: 20,
        textDecoration: "none",
        color: "#0070f3",
        fontWeight: 600,
      }}
    >
      ← Back to home
    </a>
      <h1 style={{ fontSize: 32, marginBottom: 20 }}>{program.title}</h1>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 24,
          background: "#fafafa",
        }}
      >
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
          <strong>Status:</strong>{" "}
          {program.verification_status === "verified" ? "✅ Verified" : "⏳ Pending"}
        </p>

       <div style={{ marginTop: 16, display: "flex", gap: 10 }}>

  <a
    href={program.official_url || "#"}
    target="_blank"
    rel="noreferrer"
    style={{
      padding: "12px 18px",
      background: "#0070f3",
      color: "white",
      borderRadius: 8,
      textDecoration: "none",
      pointerEvents: program.official_url ? "auto" : "none",
      opacity: program.official_url ? 1 : 0.6,
    }}
  >
    Apply Now
  </a>

  <CopyLinkButton />

</div>
      </div>

      {program.description && (
        <div
          style={{
            marginTop: 24,
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 24,
            background: "#fff",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Program Description</h2>
          <p style={{ lineHeight: 1.7, whiteSpace: "pre-line" }}>
            {program.description}
          </p>
        </div>
      )}
    </main>
  );
}

