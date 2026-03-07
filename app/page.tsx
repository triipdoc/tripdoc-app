import { supabase } from "../lib/supabase";
import ProgramsClient from "./ProgramsClient";

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
  verification_status: string | null;
  created_at?: string | null;
};

export default async function Home() {
  const { data, error } = await supabase
    .from("programs")
    .select(
      "id,title,slug,type,country,funding_type,deadline,official_url,official_url,image_url,verification_status,created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <pre style={{ padding: 24, whiteSpace: "pre-wrap" }}>
        {JSON.stringify(error, null, 2)}
      </pre>
    );
  }

  const programs = (data || []) as Program[];

  const closingSoon = programs.filter((p) => {
    if (!p.deadline) return false;

    const deadline = new Date(p.deadline);
    const today = new Date();

    const diff =
      (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    return diff <= 7 && diff >= 0;
  });

  const newlyAdded = programs.slice(0, 4);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 32 }}>
      <div style={{ marginBottom: 40 }}>
  <h1 style={{ fontSize: 42, marginBottom: 10 }}>
    Discover Verified Global Opportunities
  </h1>

  <p style={{ fontSize: 18, color: "#555", maxWidth: 700 }}>
    TripDoc helps students and professionals find verified scholarships,
    internships, fellowships, and research programs worldwide.
  </p>
</div>

      <h2 style={{ marginTop: 40, marginBottom: 10 }}>
🔥 Closing Soon
</h2>

<p style={{ color: "#666", marginBottom: 20 }}>
Applications ending within the next 7 days.
</p>

      <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
        {closingSoon.length === 0 ? (
          <p>No urgent deadlines right now.</p>
        ) : (
          closingSoon.map((p) => (
            <div
              key={p.id}
             style={{
  border: "1px solid #e5e5e5",
  padding: 20,
  borderRadius: 12,
  background: "white",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  transition: "all 0.2s ease",
  cursor: "pointer",
}}
            >
              <a
                href={`/programs/${p.slug}`}
                style={{ fontWeight: 600, textDecoration: "none", color: "black" }}
              >
                {p.title}
              </a>

              <div style={{ fontSize: 14, marginTop: 6 }}>
                Deadline: {p.deadline}
              </div>
            </div>
          ))
        )}
      </div>

      <h2 style={{ marginTop: 50, marginBottom: 10 }}>
🆕 Newly Added Opportunities
</h2>

<p style={{ color: "#666", marginBottom: 20 }}>
Recently added verified programs on TripDoc.
</p>

      <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
        {newlyAdded.map((p) => (
          <div
            key={p.id}
            style={{
              border: "1px solid #ddd",
              padding: 16,
              borderRadius: 10,
              background: "#fafafa",
            }}
          >
            <a
              href={`/programs/${p.slug}`}
              style={{ fontWeight: 600, textDecoration: "none", color: "black" }}
            >
              {p.title}
            </a>

            <div style={{ fontSize: 14, marginTop: 6 }}>
              {p.country || "—"} • {p.funding_type || "—"}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 60 }}>
  <ProgramsClient programs={programs} />
</div>
    </main>
  );
}