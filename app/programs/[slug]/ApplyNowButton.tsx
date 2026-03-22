"use client";

import { supabase } from "../../../lib/supabase";

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

  return (
    <a
      href={officialUrl || "#"}
      target="_blank"
      rel="noreferrer"
      onClick={async () => {
        if (isDisabled) return;

        try {
          await supabase.from("clicks").insert([
            {
              program_id: programId,
              title,
              type: "apply",
            },
          ]);
        } catch (err) {
          console.error("Click tracking failed", err);
        }
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