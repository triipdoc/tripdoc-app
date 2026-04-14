import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Read the TripDoc Disclaimer regarding listings, external links, and application decisions.",
};

export default function DisclaimerPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 48px" }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>Disclaimer</h1>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        TripDoc is an informational platform created to help users discover global
        opportunities. We are not the official provider of the scholarships,
        internships, fellowships, research programs, or other listings shown on the
        site unless clearly stated otherwise.
      </p>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
        No Guarantee of Selection
      </h2>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        TripDoc does not guarantee admission, selection, interview invitations, visa
        approval, funding, or any other application outcome. Final decisions are made
        solely by the official institutions or organizations responsible for each
        opportunity.
      </p>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
        Verify on Official Sources
      </h2>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        Although we aim to share useful and verified listings, users should always
        confirm requirements, deadlines, eligibility, and all other important details
        directly on the official website before taking action.
      </p>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
        Third-Party Content
      </h2>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        TripDoc may include links to third-party websites. We are not responsible for
        the content, policies, updates, or actions of external platforms.
      </p>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
  No Fees or Agency Services
</h2>

<p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
  TripDoc does not charge users for accessing opportunity listings and does not
  operate as an agent, recruiter, or intermediary for applications unless
  explicitly stated.
</p>

<p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
  Users should be cautious of third parties claiming to represent TripDoc or
  requesting payments on behalf of opportunities listed on this platform.
</p>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
        Use at Your Own Discretion
      </h2>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        Users are responsible for their own application decisions and should use their
        own judgment, research, and verification before applying to any opportunity.
      </p>
    </main>
  );
}