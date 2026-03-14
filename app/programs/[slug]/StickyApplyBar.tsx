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
        background: "rgba(255,255,255,0.96)",
        borderTop: "1px solid #ddd",
        padding: "12px 16px",
        zIndex: 1000,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#666",
              marginBottom: 4,
              fontWeight: 600,
            }}
          >
            Official application link
          </div>

          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={title}
          >
            {title}
          </div>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{
            background: "#0070f3",
            color: "white",
            padding: "12px 18px",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 700,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Apply Now ↗
        </a>
      </div>
    </div>
  );
}