import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact TripDoc for questions, feedback, corrections, or partnership inquiries.",
};

export default function ContactPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 48px" }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>Contact Us</h1>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        If you have questions, feedback, corrections, or partnership inquiries, you
        can reach us using the contact details below.
      </p>

      <div
        style={{
          marginTop: 24,
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 24,
          background: "#fafafa",
        }}
      >
        <p style={{ margin: "0 0 12px 0", color: "#333", lineHeight: 1.7 }}>
          <strong>Email:</strong>{" "}
          <a href="mailto:info@tripdoc.net" style={{ color: "#0070f3", textDecoration: "none" }}>
            info@tripdoc.net
          </a>
        </p>

        <p style={{ margin: "0 0 12px 0", color: "#333", lineHeight: 1.7 }}>
          <strong>Website:</strong>{" "}
          <a href="https://app.tripdoc.net" style={{ color: "#0070f3", textDecoration: "none" }}>
            app.tripdoc.net
          </a>
        </p>

        <p style={{ margin: 0, color: "#555", lineHeight: 1.8 }}>
  We aim to respond within 24–48 hours for relevant inquiries.
</p>
      </div>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>
        Contact Reasons
      </h2>

      <ul style={{ color: "#555", lineHeight: 1.9, paddingLeft: 22 }}>
        <li>General questions about opportunities listed on TripDoc</li>
        <li>Requests for corrections or updates</li>
        <li>Reporting broken or outdated links</li>
        <li>Partnership or collaboration inquiries</li>
      </ul>

      <div
  style={{
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    background: "#fff8e1",
    border: "1px solid #f5d27a",
    color: "#7a5a00",
    fontWeight: 600,
    lineHeight: 1.6,
  }}
>
  ⚠️ TripDoc does not charge users for applications and does not operate as an
  agent. Always verify opportunities through official sources before applying.
</div>
    </main>
  );
}