import { supabase } from "../lib/supabase";
import ProgramsClient from "./ProgramsClient";
import HorizontalRow from "./components/HorizontalRow";

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
  featured?: boolean | null;
};

const quickCardStyle = {
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "12px 16px",
  textDecoration: "none",
  color: "black",
  background: "white",
  fontWeight: 600,
  fontSize: 16,
  display: "flex",
  alignItems: "center",
  minHeight: 52,
  minWidth: 180,
} as const;

export default async function Home() {
  const { data, error } = await supabase
    .from("programs")
    .select(
      "id,title,slug,type,country,funding_type,deadline,official_url,image_url,verification_status,created_at"
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
  const featuredPrograms = programs.filter((p) => p.featured).slice(0, 6);

  const closingSoon = programs.filter((p) => {
    if (!p.deadline) return false;

    const deadline = new Date(p.deadline);
    const today = new Date();

    const diff =
      (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    return diff <= 7 && diff >= 0;
  });

  const newlyAdded = programs.slice(0, 4);
  const trending = programs.slice(0, 3);

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

      {/* Browse by Category */}
      <div style={{ marginTop: 60 }}>
        <h2 style={{ marginBottom: 10 }}>Browse by Category</h2>
        <p style={{ color: "#666", marginBottom: 20 }}>
          Explore opportunities by category.
        </p>

        <HorizontalRow>
          <a
            href="/category/scholarship"
            style={quickCardStyle}
            className="horizontal-card"
          >
            🎓 Scholarships
          </a>

          <a
            href="/category/internship"
            style={quickCardStyle}
            className="horizontal-card"
          >
            💼 Internships
          </a>

          <a
            href="/category/research"
            style={quickCardStyle}
            className="horizontal-card"
          >
            🔬 Research
          </a>

          <a
            href="/category/fellowship"
            style={quickCardStyle}
            className="horizontal-card"
          >
            🌍 Fellowships
          </a>
        </HorizontalRow>
      </div>

      {/* Browse by Country */}
      <div style={{ marginTop: 60 }}>
        <h2 style={{ marginBottom: 10 }}>Browse by Country</h2>
        <p style={{ color: "#666", marginBottom: 20 }}>
          Explore opportunities by destination country.
        </p>

        <HorizontalRow>
          <a
            href="/country/germany"
            style={quickCardStyle}
            className="horizontal-card"
          >
            🇩🇪 Germany
          </a>

          <a
            href="/country/canada"
            style={quickCardStyle}
            className="horizontal-card"
          >
            🇨🇦 Canada
          </a>

          <a
            href="/country/netherlands"
            style={quickCardStyle}
            className="horizontal-card"
          >
            🇳🇱 Netherlands
          </a>

          <a
            href="/country/australia"
            style={quickCardStyle}
            className="horizontal-card"
          >
            🇦🇺 Australia
          </a>
        </HorizontalRow>
      </div>
{/* Featured Opportunities */}
{featuredPrograms.length > 0 && (
  <div style={{ marginTop: 60 }}>
    <h2 style={{ marginBottom: 10 }}>⭐ Featured Opportunities</h2>
    <p style={{ color: "#666", marginBottom: 20 }}>
      Hand-picked opportunities highlighted on TripDoc.
    </p>

    <HorizontalRow>
      {featuredPrograms.map((p) => (
        <div
          key={p.id}
          className="horizontal-card"
          style={{
            border: "1px solid #ddd",
            padding: 16,
            borderRadius: 10,
            background: "#fafafa",
          }}
        >
          {p.image_url && (
            <img
              src={p.image_url}
              alt={p.title}
              style={{
                width: "100%",
                height: 140,
                objectFit: "cover",
                borderRadius: 8,
                marginBottom: 10,
                display: "block",
              }}
            />
          )}

          <a
            href={`/programs/${p.slug}`}
            style={{
              fontSize: 18,
              fontWeight: 600,
              textDecoration: "none",
              color: "black",
            }}
          >
            {p.title}
          </a>

          <div
  style={{
    display: "inline-block",
    marginBottom: 10,
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

          <div style={{ marginTop: 6 }}>
            {p.country || "—"} • {p.funding_type || "—"}
          </div>
        </div>
      ))}
    </HorizontalRow>
  </div>
)}

{featuredPrograms.length > 0 && (
  <div style={{ marginTop: 60 }}>
    <h2 style={{ marginBottom: 10 }}>⭐ Featured Opportunities</h2>
    <p style={{ color: "#666", marginBottom: 20 }}>
      Hand-picked opportunities highlighted on TripDoc.
    </p>

    <HorizontalRow>
      {featuredPrograms.map((p) => (
        <div
          key={p.id}
          className="horizontal-card"
          style={{
            border: "1px solid #ddd",
            padding: 16,
            borderRadius: 10,
            background: "#fafafa",
          }}
        >
          {p.image_url && (
            <img
              src={p.image_url}
              alt={p.title}
              style={{
                width: "100%",
                height: 140,
                objectFit: "cover",
                borderRadius: 8,
                marginBottom: 10,
                display: "block",
              }}
            />
          )}

          <a
            href={`/programs/${p.slug}`}
            style={{
              fontSize: 18,
              fontWeight: 600,
              textDecoration: "none",
              color: "black",
            }}
          >
            {p.title}
          </a>
          {p.featured && (
  <div
    style={{
      display: "inline-block",
      marginBottom: 10,
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

          <div style={{ marginTop: 6 }}>
            {p.country || "—"} • {p.funding_type || "—"}
          </div>
        </div>
      ))}
    </HorizontalRow>
  </div>
)}
      {/* Closing Soon */}
      <div style={{ marginTop: 60 }}>
        <h2 style={{ marginBottom: 10 }}>🔥 Closing Soon</h2>
        <p style={{ color: "#666", marginBottom: 20 }}>
          Applications ending within the next 7 days.
        </p>

        {closingSoon.length === 0 ? (
          <p>No urgent deadlines right now.</p>
        ) : (
          <HorizontalRow>
            {closingSoon.map((p) => (
              <div
                key={p.id}
                className="horizontal-card"
                style={{
                  border: "1px solid #e5e5e5",
                  padding: 16,
                  borderRadius: 12,
                  background: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
              >
                {p.image_url && (
  <img
    src={p.image_url}
    alt={p.title}
    style={{
      width: "100%",
      height: 140,
      objectFit: "cover",
      borderRadius: 8,
      marginBottom: 10,
      display: "block",
    }}
  />
)}
                <a
                  href={`/programs/${p.slug}`}
                  style={{
                    fontWeight: 600,
                    textDecoration: "none",
                    color: "black",
                  }}
                >
                  {p.title}
                </a>

                {p.featured && (
  <div
    style={{
      display: "inline-block",
      marginBottom: 10,
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

                <div style={{ fontSize: 14, marginTop: 6 }}>
                  Deadline: {p.deadline}
                </div>
              </div>
            ))}
          </HorizontalRow>
        )}
      </div>

      {/* Newly Added */}
      <div style={{ marginTop: 60 }}>
        <h2 style={{ marginBottom: 10 }}>🆕 Newly Added Opportunities</h2>
        <p style={{ color: "#666", marginBottom: 20 }}>
          Recently added verified programs on TripDoc.
        </p>

        <HorizontalRow>
          {newlyAdded.map((p) => (
            <div
              key={p.id}
              className="horizontal-card"
              style={{
                border: "1px solid #ddd",
                padding: 16,
                borderRadius: 10,
                background: "#fafafa",
              }}
            >
              {p.image_url && (
  <img
    src={p.image_url}
    alt={p.title}
    style={{
      width: "100%",
      height: 140,
      objectFit: "cover",
      borderRadius: 8,
      marginBottom: 10,
      display: "block",
    }}
  />
)}
              <a
                href={`/programs/${p.slug}`}
                style={{
                  fontWeight: 600,
                  textDecoration: "none",
                  color: "black",
                }}
              >
                {p.title}
              </a>

              <div style={{ fontSize: 14, marginTop: 6 }}>
                {p.country || "—"} • {p.funding_type || "—"}
              </div>
            </div>
          ))}
        </HorizontalRow>
      </div>

      {/* Trending */}
      <div style={{ marginTop: 60 }}>
        <h2 style={{ marginBottom: 10 }}>🔥 Trending Opportunities</h2>
        <p style={{ color: "#666", marginBottom: 20 }}>
          Recently added and popular opportunities on TripDoc.
        </p>

        <HorizontalRow>
      {trending.map((p) => (
  <div
    key={p.id}
    className="horizontal-card"
    style={{
      border: "1px solid #ddd",
      padding: 16,
      borderRadius: 10,
      background: "#fafafa",
      minWidth: 260,
    }}
  >
    {p.image_url && (
      <img
        src={p.image_url}
        alt={p.title}
        style={{
          width: "100%",
          height: 140,
          objectFit: "cover",
          borderRadius: 8,
          marginBottom: 10,
        }}
      />
    )}

    <a
      href={`/programs/${p.slug}`}
      style={{
        fontSize: 18,
        fontWeight: 600,
        textDecoration: "none",
        color: "black",
      }}
    >
      {p.title}
    </a>

    <div style={{ marginTop: 6 }}>
      {p.country || "—"} • {p.funding_type || "—"}
    </div>
  </div>
))}
        </HorizontalRow>
      </div>

      {/* Search + Filters + Main Listing */}
      <div style={{ marginTop: 80 }}>
        <ProgramsClient programs={programs} />
      </div>
    </main>
  );
}