import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "Read the Terms and Conditions for using TripDoc and accessing opportunities listed on the platform.",
};

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 48px" }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
        Terms and Conditions
      </h1>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        By using TripDoc, you agree to these Terms and Conditions. Please read them
        carefully before using the platform.
      </p>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
        Use of the Platform
      </h2>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        TripDoc is provided to help users discover and explore global opportunities
        such as scholarships, internships, fellowships, research programs, and related
        listings. You agree to use the website lawfully and responsibly.
      </p>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
        Accuracy of Information
      </h2>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        While we aim to present accurate and useful information, TripDoc does not
        guarantee that every listing, deadline, requirement, or link will always be
        complete, current, or error-free. Users should always verify final details on
        the official source website before applying.
      </p>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
  No Agency Relationship
</h2>

<p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
  TripDoc is an informational platform and does not act as an embassy, university,
  scholarship provider, employer, recruiter, immigration authority, or official
  representative of any listed opportunity unless clearly stated otherwise.
</p>

<p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
  Using TripDoc does not create any agency, advisory, or guaranteed placement
  relationship between TripDoc and the user.
</p>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
        External Websites
      </h2>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        TripDoc may link to external or third-party websites. We do not control those
        websites and are not responsible for their content, terms, or availability.
      </p>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
        Intellectual Property
      </h2>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        The structure, branding, and original content on TripDoc may not be copied,
        reproduced, or redistributed without permission, except where allowed by law.
      </p>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
  User Responsibility
</h2>

<p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
  Users are responsible for verifying eligibility, deadlines, application
  requirements, funding details, and official instructions before applying to
  any opportunity listed on TripDoc.
</p>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
        Changes
      </h2>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        We may update these Terms and Conditions at any time. Continued use of TripDoc
        means you accept any revised version.
      </p>

      <p style={{ marginTop: 32, color: "#777", fontSize: 13 }}>
  Last updated: {new Date().toLocaleDateString()}
</p>
    </main>
  );
}