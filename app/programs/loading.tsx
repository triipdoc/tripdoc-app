export default function LoadingPrograms() {
  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 40px" }}>
      
      {/* Header skeleton */}
      <div style={{ marginBottom: 20 }}>
        <div style={skeletonTitle} />
        <div style={skeletonText} />
      </div>

      {/* Filters skeleton */}
      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={skeletonInput} />
        ))}
      </div>

      {/* Cards skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
          marginTop: 24,
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={cardSkeleton}>
            <div style={imageSkeleton} />
            <div style={line} />
            <div style={lineSmall} />
            <div style={lineSmall} />
          </div>
        ))}
      </div>
    </main>
  );
}

/* styles */
const skeletonTitle = {
  height: 36,
  width: "60%",
  background: "#eee",
  borderRadius: 6,
  marginBottom: 10,
  animation: "pulse 1.2s ease-in-out infinite",
};

const skeletonText = {
  height: 18,
  width: "40%",
  background: "#eee",
  borderRadius: 6,
};

const skeletonInput = {
  height: 36,
  width: "60%",
  background: "#eee",
  borderRadius: 6,
  marginBottom: 10,
  animation: "pulse 1.2s ease-in-out infinite",
};

const cardSkeleton = {
  padding: 16,
  borderRadius: 12,
  border: "1px solid #eee",
  background: "#fafafa",
};

const imageSkeleton = {
   height: 36,
  width: "60%",
  background: "#eee",
  borderRadius: 6,
  marginBottom: 10,
  animation: "pulse 1.2s ease-in-out infinite",
};

const line = {
  height: 16,
  width: "80%",
  background: "#eee",
  borderRadius: 6,
  marginBottom: 10,
};

const lineSmall = {
  height: 12,
  width: "60%",
  background: "#eee",
  borderRadius: 6,
  marginBottom: 6,
};