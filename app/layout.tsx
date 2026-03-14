import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://app.tripdoc.net"),
  title: {
    default: "TripDoc | Verified Global Opportunities",
    template: "%s | TripDoc",
  },
  description:
    "TripDoc helps students and professionals discover verified scholarships, internships, fellowships, research programs, and other global opportunities.",
  keywords: [
    "TripDoc",
    "scholarships",
    "internships",
    "fellowships",
    "research programs",
    "global opportunities",
    "study abroad",
    "international opportunities",
    "verified opportunities",
  ],
  openGraph: {
    title: "TripDoc | Verified Global Opportunities",
    description:
      "Discover verified scholarships, internships, fellowships, research programs, and global opportunities on TripDoc.",
    url: "https://app.tripdoc.net",
    siteName: "TripDoc",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TripDoc | Verified Global Opportunities",
    description:
      "Discover verified scholarships, internships, fellowships, research programs, and global opportunities on TripDoc.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        style={{
          margin: 0,
          fontFamily: "var(--font-geist-sans), Arial, sans-serif",
          background: "#fff",
          color: "#111",
        }}
      >
        <header
          style={{
            borderBottom: "1px solid #eee",
            boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
            padding: "16px 24px",
            marginBottom: 30,
            background: "#fff",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <a
              href="/"
              style={{
                fontWeight: 700,
                fontSize: 20,
                textDecoration: "none",
                color: "black",
                whiteSpace: "nowrap",
              }}
            >
              TripDoc
            </a>

            <nav
              style={{
                display: "flex",
                gap: 20,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <a href="/" style={{ textDecoration: "none", color: "#444" }}>
                Home
              </a>

              <a
                href="/category/scholarship"
                style={{ textDecoration: "none", color: "#444" }}
              >
                Scholarships
              </a>

              <a
                href="/category/internship"
                style={{ textDecoration: "none", color: "#444" }}
              >
                Internships
              </a>

              <a
                href="/category/research"
                style={{ textDecoration: "none", color: "#444" }}
              >
                Research
              </a>

              <a
                href="/category/fellowship"
                style={{ textDecoration: "none", color: "#444" }}
              >
                Fellowships
              </a>

              <a href="/admin" style={{ textDecoration: "none", color: "#444" }}>
                Admin
              </a>
            </nav>
          </div>
        </header>

        {children}

        <footer
          style={{
            borderTop: "1px solid #eee",
            marginTop: 60,
            padding: 24,
            textAlign: "center",
            color: "#666",
            background: "#fff",
          }}
        >
          © {new Date().getFullYear()} TripDoc — Verified global opportunities
        </footer>
      </body>
    </html>
  );
}