import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn more about TripDoc and how we help students and professionals discover verified global opportunities.",
};

export default function AboutPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 48px" }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>About TripDoc</h1>

      <div
  style={{
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: "18px 20px",
    background: "#fafafa",
    marginBottom: 22,
  }}
>
  <p style={{ margin: 0, color: "#444", lineHeight: 1.7, fontSize: 16 }}>
    TripDoc helps students and professionals discover verified scholarships,
    internships, fellowships, research programs, and other global opportunities
    in one place.
  </p>
</div>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        TripDoc is a platform built to help students, researchers, graduates, and
        professionals discover verified global opportunities more easily.
      </p>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        We curate and organize scholarships, internships, fellowships, research
        programs, and other international opportunities into a clean and searchable
        format so users can find relevant options faster.
      </p>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        Our goal is to reduce confusion, save time, and make opportunity discovery
        more transparent by prioritizing listings with clear details and official
        source links whenever available.
      </p>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>
        What We Do
      </h2>

      <ul style={{ color: "#555", lineHeight: 1.9, paddingLeft: 22 }}>
        <li>Share verified global opportunities in one place</li>
        <li>Help users explore opportunities by country, type, and funding</li>
        <li>Make search and browsing simpler and faster</li>
        <li>Support informed applications through clear presentation of details</li>
      </ul>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>
        Our Mission
      </h2>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        Our mission is to make global opportunities more accessible by helping users
        discover real options in a reliable and user-friendly way.
      </p>
    </main>
  );
}