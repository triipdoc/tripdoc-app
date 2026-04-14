import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the TripDoc Privacy Policy to understand how information may be collected and used.",
};

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 48px" }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>Privacy Policy</h1>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        TripDoc values your privacy. This Privacy Policy explains, in general terms,
        how information may be collected and used when you access or interact with
        our website.
      </p>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
        Information We May Collect
      </h2>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        We may collect limited technical or usage information such as browser type,
        device information, pages visited, and general interaction data for analytics,
        performance monitoring, and service improvement purposes.
      </p>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
        How We Use Information
      </h2>

      <ul style={{ color: "#555", lineHeight: 1.9, paddingLeft: 22 }}>
        <li>To improve website functionality and user experience</li>
        <li>To understand how visitors use TripDoc</li>
        <li>To maintain security and platform performance</li>
        <li>To respond to direct inquiries where applicable</li>
      </ul>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
  Cookies and Analytics
</h2>

<p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
  TripDoc may use cookies or similar technologies to enhance user experience,
  analyze traffic, and improve platform performance. These technologies help us
  understand how users interact with the website.
</p>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
        Third-Party Services
      </h2>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        TripDoc may use third-party tools or services for analytics, hosting, or
        performance monitoring. These services may process limited technical data as
        part of their normal operation.
      </p>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
  Advertising
</h2>

<p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
  TripDoc may display advertisements provided by third-party advertising
  partners such as Google. These partners may use cookies to serve ads based
  on prior visits to this or other websites.
</p>

<h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
  Your Choices
</h2>

<p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
  You can choose to disable cookies through your browser settings. However,
  some features of the website may not function properly as a result.
</p>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
        External Links
      </h2>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        Our platform contains links to external websites. We are not responsible for
        the privacy practices, content, or policies of third-party websites.
      </p>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>
        Changes to This Policy
      </h2>

      <p style={{ color: "#555", lineHeight: 1.8, fontSize: 16 }}>
        We may update this Privacy Policy from time to time. Continued use of the
        website after updates means you accept the revised policy.
      </p>

      <p style={{ marginTop: 32, color: "#777", fontSize: 13 }}>
  Last updated: {new Date().toLocaleDateString()}
</p>
    </main>
  );
}