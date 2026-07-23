import Link from "next/link";
import { socialLinks } from "./socialLinks";

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 56,
        padding: "48px 24px 28px",
        borderTop: "1px solid #e5e7eb",
        background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
        fontSize: 14,
        color: "#555",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 40,
            flexWrap: "wrap",
            marginBottom: 28,
          }}
        >
          {/* Brand */}
          <div style={{ maxWidth: 340 }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                color: "#111",
                marginBottom: 14,
              }}
            >
              <img
                src="/logo.png"
                alt="TripDoc logo"
                style={{
                  width: 34,
                  height: 34,
                  objectFit: "contain",
                  display: "block",
                }}
              />
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 18,
                  letterSpacing: "-0.2px",
                }}
              >
                TripDoc
              </span>
            </Link>

            <p
              style={{
                margin: "0 0 14px 0",
                lineHeight: 1.7,
                color: "#4b5563",
                fontSize: 16,
              }}
            >
              Discover verified scholarships, internships, fellowships, and global
              opportunities — all in one place.
            </p>

            <p
              style={{
                margin: 0,
                lineHeight: 1.7,
                color: "#6b7280",
                fontSize: 14,
              }}
            >
              ⚠️ Always verify details on official websites before applying.
            </p>
          </div>

          {/* Links */}
          <div
            style={{
              display: "flex",
              gap: 56,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 800,
                  marginBottom: 12,
                  color: "#111",
                  fontSize: 15,
                }}
              >
                Explore
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <Link href="/" style={footerLinkStyle}>
                  Home
                </Link>
                <Link href="/programs" style={footerLinkStyle}>
                  All Opportunities
                </Link>
                <Link href="/hiring-companies" style={footerLinkStyle}>
                  Hiring Companies
                </Link>
                <Link href="/types/scholarship" style={footerLinkStyle}>
                  Scholarships
                </Link>
                <Link href="/types/internship" style={footerLinkStyle}>
                  Internships
                </Link>
                <Link href="/types/fellowship" style={footerLinkStyle}>
                  Fellowships
                </Link>
              </div>
            </div>

            <div>
              <div
                style={{
                  fontWeight: 800,
                  marginBottom: 12,
                  color: "#111",
                  fontSize: 15,
                }}
              >
                Company
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <Link href="/about" style={footerLinkStyle}>
                  About Us
                </Link>
                <Link href="/contact" style={footerLinkStyle}>
                  Contact
                </Link>
              </div>
            </div>

            <div>
              <div
                style={{
                  fontWeight: 800,
                  marginBottom: 12,
                  color: "#111",
                  fontSize: 15,
                }}
              >
                Legal
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <Link href="/privacy" style={footerLinkStyle}>
                  Privacy Policy
                </Link>
                <Link href="/terms" style={footerLinkStyle}>
                  Terms & Conditions
                </Link>
                <Link href="/disclaimer" style={footerLinkStyle}>
                  Disclaimer
                </Link>
              </div>
            </div>

            <div>
              <div
                style={{
                  fontWeight: 800,
                  marginBottom: 12,
                  color: "#111",
                  fontSize: 15,
                }}
              >
                Follow
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {socialLinks.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.ariaLabel}
                    style={footerLinkStyle}
                  >
                    {item.name}{" "}
                    <span style={{ color: "#6b7280" }}>{item.handle}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            paddingTop: 18,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 13,
            color: "#6b7280",
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

const footerLinkStyle = {
  textDecoration: "none",
  color: "#374151",
  fontWeight: 500,
};
