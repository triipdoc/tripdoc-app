"use client";

export default function StickyApplyBar({
  title,
  url,
}: {
  title: string;
  url: string | null;
}) {
  if (!url) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "white",
        borderTop: "1px solid #ddd",
        padding: "14px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div style={{ fontWeight: 600 }}>{title}</div>

      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        style={{
          background: "#0070f3",
          color: "white",
          padding: "10px 18px",
          borderRadius: 8,
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        Apply Now
      </a>
    </div>
  );
}