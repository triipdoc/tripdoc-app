import { supabase } from "../../../lib/supabase";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;

  const { data } = await supabase
    .from("programs")
    .select("*")
    .ilike("type", type);

  const programs = data || [];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
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

      <h1 style={{ marginBottom: 20 }}>
        {type.charAt(0).toUpperCase() + type.slice(1)} Opportunities
      </h1>

      {programs.length === 0 ? (
  <p>No opportunities found in this category yet.</p>
) : (
  <div style={{ display: "grid", gap: 20 }}>
    {programs.map((p: any) => (
      <div
        key={p.id}
        style={{
          border: "1px solid #ddd",
          padding: 20,
          borderRadius: 10,
          background: "#fafafa",
        }}
      >
        <a
          href={`/programs/${p.slug}`}
          style={{
            fontSize: 20,
            fontWeight: 600,
            textDecoration: "none",
            color: "black",
          }}
        >
          {p.title}
        </a>

        <div style={{ marginTop: 8 }}>
          {p.country || "—"} • {p.funding_type || "—"}
        </div>
      </div>
    ))}
  </div>
)}
    </main>
  );
}