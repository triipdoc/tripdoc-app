export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 24,
        padding: "32px 24px",
        borderTop: "1px solid #eee",
        textAlign: "center",
        color: "#666",
        fontSize: 14,
        background: "#fff",
      }}
    >
      <div style={{ marginBottom: 10, fontWeight: 700, color: "#111" }}>
        TripDoc
      </div>

      <div style={{ marginBottom: 16 }}>
        Discover verified scholarships, internships, fellowships, and research
        opportunities worldwide.
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <a href="/" style={{ color: "#444", textDecoration: "none" }}>
          Home
        </a>

        <a
          href="/category/scholarship"
          style={{ color: "#444", textDecoration: "none" }}
        >
          Scholarships
        </a>

        <a
          href="/category/internship"
          style={{ color: "#444", textDecoration: "none" }}
        >
          Internships
        </a>

        <a
          href="/category/fellowship"
          style={{ color: "#444", textDecoration: "none" }}
        >
          Fellowships
        </a>
      </div>

      <div style={{ marginTop: 20 }}>
        © {new Date().getFullYear()} TripDoc. All rights reserved.
      </div>
    </footer>
  );
}