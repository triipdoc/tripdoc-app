export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 60,
        padding: "50px 24px 30px",
        borderTop: "1px solid #eee",
        background: "linear-gradient(180deg, #fafafa 0%, #ffffff 100%)",
        fontSize: 14,
        color: "#555",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        
        {/* TOP SECTION */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 40,
            flexWrap: "wrap",
            marginBottom: 30,
          }}
        >
          {/* BRAND */}
          <div style={{ maxWidth: 320 }}>
            <div
              style={{
                fontWeight: 900,
                fontSize: 22,
                color: "#111",
                marginBottom: 10,
              }}
            >
              🌍 TripDoc
            </div>

            <p style={{ lineHeight: 1.6 }}>
              Discover verified scholarships, internships, fellowships, and
              global opportunities — all in one place.
            </p>

            <p style={{ marginTop: 12, fontSize: 13, color: "#777" }}>
              ⚠️ Always verify details on official websites before applying.
            </p>
          </div>

          {/* LINKS */}
          <div
            style={{
              display: "flex",
              gap: 50,
              flexWrap: "wrap",
            }}
          >
            {/* Explore */}
            <div>
              <div style={{ fontWeight: 800, marginBottom: 10, color: "#111" }}>
                Explore
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <a href="/" style={linkStyle}>Home</a>
                <a href="/programs" style={linkStyle}>All Opportunities</a>
                <a href="/types/scholarship" style={linkStyle}>Scholarships</a>
                <a href="/types/internship" style={linkStyle}>Internships</a>
                <a href="/types/fellowship" style={linkStyle}>Fellowships</a>
              </div>
            </div>

            {/* Company */}
            <div>
              <div style={{ fontWeight: 800, marginBottom: 10, color: "#111" }}>
                Company
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <a href="/about" style={linkStyle}>About Us</a>
                <a href="/contact" style={linkStyle}>Contact</a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <div style={{ fontWeight: 800, marginBottom: 10, color: "#111" }}>
                Legal
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <a href="/privacy" style={linkStyle}>Privacy Policy</a>
                <a href="/terms" style={linkStyle}>Terms & Conditions</a>
                <a href="/disclaimer" style={linkStyle}>Disclaimer</a>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div
          style={{
            borderTop: "1px solid #eee",
            paddingTop: 16,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            fontSize: 13,
            color: "#777",
          }}
        >
          <span>© {new Date().getFullYear()} TripDoc. All rights reserved.</span>

          <span style={{ fontWeight: 600 }}>
            Built for global opportunity seekers 🚀
          </span>
        </div>
      </div>
    </footer>
  );
}

const linkStyle = {
  textDecoration: "none",
  color: "#444",
  fontWeight: 500,
  transition: "all 0.2s ease",
};