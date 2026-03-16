import { supabase } from "../lib/supabase";
import ProgramsClient from "./ProgramsClient";
import HorizontalRow from "./components/HorizontalRow";
import HeroSearch from "./components/HeroSearch";
import Footer from "./components/Footer";

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
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: "16px 18px",
  textDecoration: "none",
  color: "black",
  background: "white",
  fontWeight: 700,
  fontSize: 16,
  display: "flex",
  alignItems: "center",
  minHeight: 60,
  minWidth: 200,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
} as const;

const cardStyle = {
  border: "1px solid #e5e7eb",
  padding: 18,
  borderRadius: 14,
  background: "white",
  minWidth: 260,
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
} as const;

function isNotExpired(deadline?: string | null) {
  if (!deadline) return true;

  const today = new Date();
  const d = new Date(deadline + "T23:59:59");

  return d.getTime() >= today.getTime();
}

export default async function Home() {
  const { data, error } = await supabase
    .from("programs")
    .select(
      "id,title,slug,type,country,funding_type,deadline,official_url,image_url,verification_status,created_at,featured"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <pre style={{ padding: 24, whiteSpace: "pre-wrap" }}>
        {JSON.stringify(error, null, 2)}
      </pre>
    );
  }

  const programs = ((data || []) as Program[]).filter((p) => {
    const cleanTitle = p.title?.trim().toLowerCase();

    return (
      !!p.id &&
      !!p.slug &&
      !!p.title &&
      cleanTitle !== "featured" &&
      cleanTitle !== "test" &&
      cleanTitle !== "draft"
    );
  });

  const featuredPrograms = programs
    .filter(
      (p) =>
        p.featured &&
        p.verification_status === "verified" &&
        isNotExpired(p.deadline)
    )
    .slice(0, 6);

  const featuredIds = new Set(featuredPrograms.map((p) => p.id));

  const closingSoon = programs
    .filter((p) => {
      if (!p.deadline) return false;
      if (featuredIds.has(p.id)) return false;

      const deadline = new Date(p.deadline + "T23:59:59");
      const today = new Date();

      const diff =
        (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

      return diff <= 7 && diff >= 0;
    })
    .slice(0, 6);

  const closingSoonIds = new Set(closingSoon.map((p) => p.id));

  const newlyAdded = programs
    .filter(
      (p) =>
        !featuredIds.has(p.id) &&
        !closingSoonIds.has(p.id) &&
        isNotExpired(p.deadline)
    )
    .slice(0, 4);

  const newlyAddedIds = new Set(newlyAdded.map((p) => p.id));

  const trending = programs
    .filter(
      (p) =>
        !featuredIds.has(p.id) &&
        !closingSoonIds.has(p.id) &&
        !newlyAddedIds.has(p.id) &&
        p.verification_status === "verified" &&
        isNotExpired(p.deadline)
    )
    .slice(0, 3);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 32px 48px" }}>
      <div
        style={{
          marginBottom: 80,
          padding: "56px 0 32px",
        }}
      >
        <h1
          style={{
            fontSize: 56,
            fontWeight: 800,
            marginBottom: 16,
            lineHeight: 1.2,
            letterSpacing: "-0.5px",
          }}
        >
          Discover Verified Global Opportunities Worldwide
        </h1>

        <p
          style={{
            fontSize: 20,
            color: "#555",
            maxWidth: 680,
            marginBottom: 28,
          }}
        >
          Scholarships, internships, fellowships, and research programs worldwide —
          all verified and curated to help you study, travel, and build your career.
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <a
            href="/category/scholarship"
            style={{
              background: "#0070f3",
              color: "white",
              padding: "13px 22px",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 700,
              boxShadow: "0 6px 18px rgba(0,112,243,0.22)",
            }}
          >
            🎓 Explore Scholarships
          </a>

          <a
            href="/category/internship"
            style={{
              border: "1px solid #ddd",
              padding: "13px 22px",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 700,
              color: "#333",
              background: "white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            💼 Explore Internships
          </a>
        </div>

        <HeroSearch />

        <div
          style={{
            marginTop: 28,
            display: "flex",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          {[
            "🌍 30+ Countries",
            "🎓 500+ Opportunities",
            "✅ Verified Listings",
            "⚡ Updated Daily",
          ].map((item) => (
            <div
              key={item}
              style={{
                border: "1px solid #e5e7eb",
                padding: "10px 16px",
                borderRadius: 10,
                background: "#fafafa",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {item}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            marginTop: 20,
            color: "#555",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          <span>✅ Verified opportunities</span>
          <span>🌍 Global destinations</span>
          <span>🔎 Easy search and filters</span>
        </div>
      </div>

      {/* Browse by Category */}
      <div style={{ marginTop: 72 }}>
        <h2 style={{ marginBottom: 10, fontSize: 28, fontWeight: 700 }}>
          Browse by Category
        </h2>
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

      {/* Popular Opportunities */}

<div style={{ marginTop: 72 }}>
  <h2 style={{ marginBottom: 10, fontSize: 28, fontWeight: 700 }}>
    🔥 Popular Opportunities
  </h2>

  <p style={{ color: "#666", marginBottom: 20 }}>
    Verified programs many students are currently exploring.
  </p>

  <HorizontalRow>
    {programs
      .filter(
        (p) =>
          p.verification_status === "verified" &&
          p.deadline &&
          new Date(p.deadline) > new Date()
      )
      .slice(0, 6)
      .map((p) => (
        <a
          key={p.id}
          href={`/programs/${p.slug}`}
          className="horizontal-card"
          style={{
            ...cardStyle,
            display: "block",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          {p.image_url && (
            <img
              src={p.image_url}
              alt={p.title}
              loading="lazy"
              style={{
                width: "100%",
                height: 140,
                objectFit: "cover",
                borderRadius: 8,
                marginBottom: 10,
              }}
            />
          )}

          <div
            style={{
              fontWeight: 600,
              color: "black",
              fontSize: 18,
            }}
          >
            {p.title}
          </div>

          <div style={{ marginTop: 6 }}>
            {p.country || "—"} • {p.funding_type || "—"}
          </div>
        </a>
      ))}
  </HorizontalRow>
</div>

      {/* Featured Opportunities */}
      {featuredPrograms.length > 0 && (
        <div style={{ marginTop: 72 }}>
          <h2 style={{ marginBottom: 10, fontSize: 28, fontWeight: 700 }}>
            ⭐ Featured Opportunities
          </h2>
          <p style={{ color: "#666", marginBottom: 20 }}>
            Hand-picked opportunities highlighted on TripDoc.
          </p>

          <HorizontalRow>
            {featuredPrograms.map((p) => (
              <a
                key={p.id}
                href={`/programs/${p.slug}`}
                className="horizontal-card"
                style={{
                  ...cardStyle,
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.title}
                    loading="lazy"
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

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "black",
                  }}
                >
                  {p.title}
                </div>

                <div style={{ marginTop: 6 }}>
                  {p.country || "—"} • {p.funding_type || "—"}
                </div>
              </a>
            ))}
          </HorizontalRow>
        </div>
      )}

      {/* Browse by Country */}
      <div style={{ marginTop: 72 }}>
        <h2 style={{ marginBottom: 10, fontSize: 28, fontWeight: 700 }}>
          Browse by Country
        </h2>
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

      {/* Closing Soon */}
      <div style={{ marginTop: 72 }}>
        <h2 style={{ marginBottom: 10, fontSize: 28, fontWeight: 700 }}>
          🔥 Closing Soon
        </h2>
        <p style={{ color: "#666", marginBottom: 20 }}>
          Applications ending within the next 7 days.
        </p>

        {closingSoon.length === 0 ? (
          <p>No urgent deadlines right now.</p>
        ) : (
          <HorizontalRow>
            {closingSoon.map((p) => (
              <a
                key={p.id}
                href={`/programs/${p.slug}`}
                className="horizontal-card"
                style={{
                  border: "1px solid #e5e5e5",
                  padding: 16,
                  borderRadius: 12,
                  background: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  minWidth: 260,
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.title}
                    loading="lazy"
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

                <div
                  style={{
                    fontWeight: 600,
                    color: "black",
                  }}
                >
                  {p.title}
                </div>

                <div style={{ fontSize: 14, marginTop: 6 }}>
                  Deadline: {p.deadline}
                </div>
              </a>
            ))}
          </HorizontalRow>
        )}
      </div>

      {/* Newly Added */}
      {newlyAdded.length > 0 && (
        <div style={{ marginTop: 72 }}>
          <h2 style={{ marginBottom: 10, fontSize: 28, fontWeight: 700 }}>
            🆕 Newly Added Opportunities
          </h2>
          <p style={{ color: "#666", marginBottom: 20 }}>
            Recently added verified programs on TripDoc.
          </p>

          <HorizontalRow>
            {newlyAdded.map((p) => (
              <a
                key={p.id}
                href={`/programs/${p.slug}`}
                className="horizontal-card"
                style={{
                  ...cardStyle,
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.title}
                    loading="lazy"
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

                <div
                  style={{
                    fontWeight: 600,
                    color: "black",
                  }}
                >
                  {p.title}
                </div>

                <div style={{ fontSize: 14, marginTop: 6 }}>
                  {p.country || "—"} • {p.funding_type || "—"}
                </div>
              </a>
            ))}
          </HorizontalRow>
        </div>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <div style={{ marginTop: 72 }}>
          <h2 style={{ marginBottom: 10, fontSize: 28, fontWeight: 700 }}>
            🔥 Trending Opportunities
          </h2>
          <p style={{ color: "#666", marginBottom: 20 }}>
            Recently added and popular opportunities on TripDoc.
          </p>

          <HorizontalRow>
            {trending.map((p) => (
              <a
                key={p.id}
                href={`/programs/${p.slug}`}
                className="horizontal-card"
                style={{
                  ...cardStyle,
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.title}
                    loading="lazy"
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

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "black",
                  }}
                >
                  {p.title}
                </div>

                <div style={{ marginTop: 6 }}>
                  {p.country || "—"} • {p.funding_type || "—"}
                </div>
              </a>
            ))}
          </HorizontalRow>
        </div>
      )}

      {/* Search + Filters + Main Listing */}
      <div id="all-opportunities" style={{ marginTop: 88 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ marginBottom: 10, fontSize: 30, fontWeight: 800 }}>
            Explore All Opportunities
          </h2>

          <p style={{ color: "#666", margin: 0, maxWidth: 760, fontSize: 17 }}>
            Search and filter verified scholarships, internships, fellowships, and
            research programs from around the world.
          </p>
        </div>

        <ProgramsClient programs={programs} />
      </div>
    </main>
  );
}