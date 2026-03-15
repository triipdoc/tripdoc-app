import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HeaderNav from "./components/HeaderNav";

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
            padding: "14px 24px",
            marginBottom: 30,
            background: "rgba(255,255,255,0.96)",
            position: "sticky",
            top: 0,
            zIndex: 100,
            backdropFilter: "blur(10px)",
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
                display: "flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
                color: "black",
                fontWeight: 800,
                fontSize: 22,
                whiteSpace: "nowrap",
              }}
            >
              <img
                src="/logo.png"
                alt="TripDoc Logo"
                style={{
                  height: 34,
                  width: "auto",
                  display: "block",
                }}
              />
              <span>TripDoc</span>
            </a>

            <HeaderNav />
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