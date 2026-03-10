import { supabase } from "../../../lib/supabase";

export default async function CountryPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;

  const countryName = decodeURIComponent(name);

  const { data } = await supabase
    .from("programs")
    .select("*")
    .ilike("country", countryName);

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

      <h1 style={{ marginBottom: 10 }}>
        Opportunities in {countryName.charAt(0).toUpperCase() + countryName.slice(1)}
      </h1>

      <p style={{ color: "#666", marginBottom: 24 }}>
        Explore verified opportunities available in {countryName}.
      </p>

      {programs.length === 0 ? (
        <p>No opportunities found for this country yet.</p>
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