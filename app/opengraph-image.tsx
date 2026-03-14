import { ImageResponse } from "next/og";

export const alt = "TripDoc — Verified global opportunities";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%)",
          color: "#111",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "#0070f3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            T
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              TripDoc
            </div>

            <div
              style={{
                fontSize: 18,
                color: "#555",
              }}
            >
              Verified global opportunities
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            maxWidth: 900,
          }}
        >
          <div
            style={{
              fontSize: 64,
              lineHeight: 1.1,
              fontWeight: 800,
            }}
          >
            Discover Scholarships, Internships, Fellowships and Research Programs
          </div>

          <div
            style={{
              fontSize: 28,
              lineHeight: 1.4,
              color: "#333",
            }}
          >
            Explore verified international opportunities for students and professionals worldwide.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          {["Scholarships", "Internships", "Research", "Fellowships"].map((item) => (
            <div
              key={item}
              style={{
                padding: "12px 20px",
                borderRadius: 999,
                background: "white",
                border: "1px solid #dbe4f0",
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}