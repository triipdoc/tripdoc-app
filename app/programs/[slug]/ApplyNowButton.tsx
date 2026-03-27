"use client";

type ApplyNowButtonProps = {
  programId: string;
  title: string;
  officialUrl: string | null;
};

export default function ApplyNowButton({
  programId,
  title,
  officialUrl,
}: ApplyNowButtonProps) {
  const isDisabled = !officialUrl;

  async function trackApplyClick() {
    try {
      const res = await fetch("/api/track-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        keepalive: true,
        body: JSON.stringify({
          program_id: programId,
          action: "apply_now",
        }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Apply tracking API error:", result || res.statusText);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Apply tracking failed:", err);
      return false;
    }
  }

  return (
    <a
      href={officialUrl || "#"}
      target="_blank"
      rel="noreferrer"
      onClick={async (e) => {
        if (isDisabled || !programId) {
          e.preventDefault();
          return;
        }

        await trackApplyClick();
      }}
      style={{
        padding: "14px 22px",
        background: "#0070f3",
        color: "white",
        borderRadius: 10,
        boxShadow: "0 8px 20px rgba(0,112,243,0.18)",
        textDecoration: "none",
        fontWeight: 600,
        pointerEvents: isDisabled ? "none" : "auto",
        opacity: isDisabled ? 0.6 : 1,
        display: "inline-block",
      }}
    >
      Apply Now
    </a>
  );
}